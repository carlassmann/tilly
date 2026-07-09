import { beforeEach, describe, expect, test, vi } from "vitest"
import { CRON_SECRET } from "astro:env/server"
import { Hono } from "hono"
import { createJazzTestAccount, setupJazzTestSync } from "jazz-tools/testing"
import { ServerAccount } from "#shared/schema/server"
import { cronDeliveryApp } from "./cron-delivery"
import { pushRegisterApp } from "./register"
import { testNotificationApp } from "./test-notification"

let workerHolder = vi.hoisted(() => ({ worker: null as unknown }))

vi.mock("#server/lib/utils", async importOriginal => ({
	...(await importOriginal<typeof import("#server/lib/utils")>()),
	getServerWorker: vi.fn(async () => workerHolder.worker),
}))

vi.mock("../operations/deliver-notifications", async () => {
	let { Result } = await import("better-result")
	return {
		deliverNotifications: vi.fn(async () =>
			Result.ok({ message: "ok", results: [] }),
		),
	}
})

// Regression test for the /push mount composition in src/server/main.ts:
// multiple apps share the /push mount path, so middleware registered with
// `use("*")` in one app would run for every other app's routes. The cron
// endpoint must be reachable with only the bearer secret — Vercel's cron
// cannot provide Jazz auth.
describe("push route composition", () => {
	let app = new Hono()
		.route("/push", testNotificationApp)
		.route("/push", cronDeliveryApp)
		.route("/push", pushRegisterApp)

	beforeEach(async () => {
		await setupJazzTestSync()
		workerHolder.worker = await createJazzTestAccount({
			AccountSchema: ServerAccount,
		})
	})

	test("cron delivery accepts the bearer secret without Jazz auth", async () => {
		let res = await app.request("/push/deliver-notifications", {
			headers: { Authorization: `Bearer ${CRON_SECRET}` },
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ message: "ok", results: [] })
	})

	test("cron delivery rejects a wrong bearer secret", async () => {
		let res = await app.request("/push/deliver-notifications", {
			headers: { Authorization: "Bearer wrong-secret" },
		})

		expect(res.status).toBe(401)
		expect(await res.text()).not.toContain("Authentication required")
	})

	test("test notification still requires Jazz auth", async () => {
		let res = await app.request("/push/send-test-notification", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ endpoint: "https://example.com" }),
		})

		expect(res.status).toBe(401)
		expect(await res.json()).toEqual({
			error: "Authentication required",
			code: "unauthorized",
		})
	})

	test("register still requires Jazz auth", async () => {
		let res = await app.request("/push/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ notificationSettingsId: "abc123" }),
		})

		expect(res.status).toBe(401)
		expect(await res.json()).toEqual({
			error: "Authentication required",
			code: "unauthorized",
		})
	})
})
