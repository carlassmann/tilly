import { CRON_SECRET } from "astro:env/server"
import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { errorToStatus } from "#server/lib/errors"
import { requireServerWorker } from "../middleware/push-auth"
import { deliverNotifications } from "../operations/deliver-notifications"

export { cronDeliveryApp }

let cronDeliveryApp = new Hono()
	// Middleware must stay scoped to the route: apps sharing a mount path in
	// main.ts would otherwise run each other's `use("*")` middleware.
	.get(
		"/deliver-notifications",
		bearerAuth({ token: CRON_SECRET }),
		requireServerWorker,
		async c => {
			let worker = c.get("serverWorker")
			let result = await deliverNotifications(worker)

			if (result.isErr()) {
				let e = result.error
				return c.json({ error: e.message, code: e._tag }, errorToStatus(e))
			}

			return c.json(result.value)
		},
	)
