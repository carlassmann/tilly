import "jazz-tools/load-edge-wasm"
import { createExports as createAstroExports } from "@astrojs/cloudflare/entrypoints/server.js"
import type { SSRManifest } from "astro"
import { CRON_SECRET } from "astro:env/server"
import { cronDeliveryApp } from "./features/push"
import { runWithRequestWorkers } from "./lib/request-workers"

export { createExports }

type WorkerFetch = ReturnType<typeof createAstroExports>["default"]["fetch"]

function createExports(manifest: SSRManifest) {
	let astro = createAstroExports(manifest).default
	let fetch: WorkerFetch = async (request, environment, context) => {
		let url = new URL(request.url)
		if (url.hostname === "tilly.social") {
			url.hostname = "www.tilly.social"
			return Response.redirect(url, 307)
		}
		if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
			url.pathname = "/app/"
			return environment.ASSETS.fetch(url.href)
		}
		if (
			url.pathname.startsWith("/plausible/") ||
			url.pathname === "/api/event"
		) {
			let originalHost = url.host
			url.host = "plausible.io"
			url.protocol = "https:"
			url.pathname = url.pathname.replace(/^\/plausible\//, "/")
			let forwarded = new Request(url, {
				method: request.method,
				headers: Object.fromEntries(request.headers),
				body:
					request.method === "GET" || request.method === "HEAD"
						? undefined
						: await request.arrayBuffer(),
			})
			forwarded.headers.delete("cookie")
			forwarded.headers.delete("authorization")
			forwarded.headers.delete("host")
			forwarded.headers.delete("X-Forwarded-For")
			forwarded.headers.set("X-Forwarded-Host", originalHost)
			let clientAddress = request.headers.get("CF-Connecting-IP")
			if (clientAddress) forwarded.headers.set("X-Forwarded-For", clientAddress)
			return globalThis.fetch(new Request(forwarded, { redirect: "manual" }))
		}
		return runWithRequestWorkers(
			() => astro.fetch(request, environment, context),
			task => context.waitUntil(task),
		)
	}
	async function scheduled() {
		let response = await runWithRequestWorkers(async () =>
			cronDeliveryApp.request("https://tilly.social/deliver-notifications", {
				headers: { authorization: `Bearer ${CRON_SECRET}` },
			}),
		)
		await response.text()
		if (!response.ok)
			throw new Error(`Notification job failed: ${response.status}`)
	}
	return { default: { fetch, scheduled } }
}
