import { AsyncLocalStorage } from "node:async_hooks"
import { WebSocketPeerWithReconnection } from "cojson-transport-ws"
import type { Peer } from "jazz-tools"
import type { ServerWorker, UserWorker } from "./utils"

export { runWithRequestWorkers, requestWorkers, openRequestWorker }

async function runWithRequestWorkers(operation: () => Promise<Response>) {
	let scope: WorkerScope = { cleanups: new Set(), finished: false }
	return requestWorkers.run(scope, async () => {
		try {
			let response = await operation()
			if (!response.body) {
				await finishWorkers(scope)
				return response
			}
			let reader = response.body.getReader()
			let body = new ReadableStream<Uint8Array>({
				async pull(controller) {
					try {
						let next = await reader.read()
						if (next.done) {
							await finishWorkers(scope)
							controller.close()
						} else controller.enqueue(next.value)
					} catch (error) {
						await finishWorkers(scope)
						controller.error(error)
					}
				},
				async cancel(reason) {
					try {
						await reader.cancel(reason)
					} finally {
						await finishWorkers(scope)
					}
				},
			})
			return new Response(body, response)
		} catch (error) {
			await finishWorkers(scope)
			throw error
		}
	})
}

async function openRequestWorker<Worker extends ServerWorker | UserWorker>(
	scope: WorkerScope,
	syncServer: string,
	create: (peer: Peer) => Promise<{ worker: Worker }>,
) {
	let abandoned = false
	let node: ServerWorker["$jazz"]["localNode"] | undefined
	let pending: Peer[] = []
	let receivePeer: (peer: Peer) => void = () => undefined
	let connected = new Promise<Peer>(resolve => {
		receivePeer = resolve
	})
	let connection = new WebSocketPeerWithReconnection({
		peer: syncServer,
		reconnectionTimeout: 100,
		addPeer(peer) {
			if (node) node.syncManager.addPeer(peer)
			else pending.push(peer)
			receivePeer(peer)
		},
		removePeer() {},
		WebSocketConstructor: WebSocket,
	})
	// Each Worker request owns its sockets; streaming chat retains them until EOF.
	let cleanup = async () => {
		try {
			await node?.syncManager.waitForAllCoValuesSync(5_000)
		} catch (error) {
			console.error("Request worker sync failed", error)
		} finally {
			connection.disable()
			await node?.gracefulShutdown()
		}
	}
	let timeout: ReturnType<typeof setTimeout> | undefined
	scope.cleanups.add(cleanup)
	try {
		connection.enable()
		let result = await Promise.race([
			connected.then(async peer => {
				let result = await create(peer)
				node = result.worker.$jazz.localNode
				for (let next of pending) {
					if (next !== peer) node.syncManager.addPeer(next)
				}
				pending = []
				if (scope.finished || abandoned) {
					await cleanup()
					throw new Error("Worker request already finished")
				}
				return result.worker
			}),
			new Promise<never>((_, reject) => {
				timeout = setTimeout(
					() => reject(new Error("Worker initialization timed out")),
					30_000,
				)
			}),
		])
		return result
	} catch (error) {
		abandoned = true
		await cleanup()
		throw error
	} finally {
		if (timeout) clearTimeout(timeout)
	}
}

async function finishWorkers(scope: WorkerScope) {
	if (scope.finished) return
	scope.finished = true
	await Promise.allSettled([...scope.cleanups].map(cleanup => cleanup()))
	scope.cleanups.clear()
}

type WorkerScope = {
	serverWorker?: Promise<ServerWorker>
	cleanups: Set<() => Promise<void>>
	finished: boolean
}

let requestWorkers = new AsyncLocalStorage<WorkerScope>()
