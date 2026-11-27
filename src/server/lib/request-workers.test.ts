import { expect, test } from "vitest"
import { requestWorkers, runWithRequestWorkers } from "./request-workers"

test("streaming keeps workers until the body ends, then releases them", async () => {
	let events: string[] = []
	let response = await runWithRequestWorkers(async () => {
		requestWorkers.getStore()?.cleanups.add(async () => {
			events.push("closed")
		})
		return new Response("streamed chat")
	})
	events.push("response received")
	let body = await response.text()
	expect({ body, events }).toMatchInlineSnapshot(`
		{
		  "body": "streamed chat",
		  "events": [
		    "response received",
		    "closed",
		  ],
		}
	`)
})

test("cancellation releases workers and cancels the upstream body", async () => {
	let events: string[] = []
	let response = await runWithRequestWorkers(async () => {
		requestWorkers.getStore()?.cleanups.add(async () => {
			events.push("closed")
		})
		return new Response(
			new ReadableStream({
				cancel() {
					events.push("upstream cancelled")
				},
			}),
		)
	})
	await response.body?.cancel()
	expect(events).toMatchInlineSnapshot(`
		[
		  "upstream cancelled",
		  "closed",
		]
	`)
})

test("failed requests release workers", async () => {
	let events: string[] = []
	await expect(
		runWithRequestWorkers(async () => {
			requestWorkers.getStore()?.cleanups.add(async () => {
				events.push("closed")
			})
			throw new Error("request failed")
		}),
	).rejects.toThrow("request failed")
	expect(events).toMatchInlineSnapshot(`
		[
		  "closed",
		]
	`)
})

test("overlapping requests keep their worker scopes separate", async () => {
	let events: string[] = []
	let first = await runWithRequestWorkers(async () => {
		requestWorkers.getStore()?.cleanups.add(async () => {
			events.push("first closed")
		})
		return new Response("first")
	})
	let second = await runWithRequestWorkers(async () => {
		requestWorkers.getStore()?.cleanups.add(async () => {
			events.push("second closed")
		})
		return new Response("second")
	})
	await second.text()
	events.push("second consumed")
	await first.text()
	expect(events).toMatchInlineSnapshot(`
		[
		  "second closed",
		  "second consumed",
		  "first closed",
		]
	`)
})
