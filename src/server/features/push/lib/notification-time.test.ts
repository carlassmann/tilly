import { expect, test } from "vitest"
import {
	isPastNotificationTime,
	wasDeliveredToday,
	type NotificationTimeSettings,
} from "./notification-time"

let utc9: NotificationTimeSettings = {
	timezone: "UTC",
	notificationTime: "09:00",
}
let ny9: NotificationTimeSettings = {
	timezone: "America/New_York",
	notificationTime: "09:00",
}
let utcDefault: NotificationTimeSettings = { timezone: "UTC" }

test("isPastNotificationTime", () => {
	let cases: [NotificationTimeSettings, string][] = [
		[utc9, "2025-01-15T08:00:00Z"],
		[utc9, "2025-01-15T09:00:00Z"],
		[utc9, "2025-01-15T10:00:00Z"],
		[ny9, "2025-01-15T13:00:00Z"],
		[ny9, "2025-01-15T14:00:00Z"],
		[utcDefault, "2025-01-15T11:59:00Z"],
		[utcDefault, "2025-01-15T12:00:00Z"],
	]
	let table = cases.map(
		([settings, now]) =>
			`${describeSettings(settings)} | now ${now} -> ${isPastNotificationTime(settings, new Date(now))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "UTC 09:00 | now 2025-01-15T08:00:00Z -> false",
		  "UTC 09:00 | now 2025-01-15T09:00:00Z -> true",
		  "UTC 09:00 | now 2025-01-15T10:00:00Z -> true",
		  "America/New_York 09:00 | now 2025-01-15T13:00:00Z -> false",
		  "America/New_York 09:00 | now 2025-01-15T14:00:00Z -> true",
		  "UTC (default) | now 2025-01-15T11:59:00Z -> false",
		  "UTC (default) | now 2025-01-15T12:00:00Z -> true",
		]
	`)
})

test("wasDeliveredToday", () => {
	let cases: [NotificationTimeSettings, string | undefined, string][] = [
		[utc9, undefined, "2025-01-15T10:00:00Z"],
		[utc9, "2025-01-14T09:00:00Z", "2025-01-15T10:00:00Z"],
		[utc9, "2025-01-15T09:30:00Z", "2025-01-15T10:00:00Z"],
		[utc9, "2025-01-15T09:00:00Z", "2025-01-15T10:00:00Z"],
		[utc9, "2025-01-15T08:00:00Z", "2025-01-15T10:00:00Z"],
		[utc9, "2025-01-14T09:00:00Z", "2025-01-15T09:00:00Z"],
		[utc9, "2025-01-15T09:00:00Z", "2025-01-15T18:00:00Z"],
		[ny9, "2025-01-15T14:30:00Z", "2025-01-15T15:00:00Z"],
		[ny9, "2025-01-15T03:00:00Z", "2025-01-15T15:00:00Z"],
	]
	let table = cases.map(([settings, delivered, now]) => {
		let withDelivery = {
			...settings,
			lastDeliveredAt: delivered ? new Date(delivered) : undefined,
		}
		let result = wasDeliveredToday(withDelivery, new Date(now))
		return `${describeSettings(settings)} | delivered ${delivered ?? "never"} | now ${now} -> ${result}`
	})
	expect(table).toMatchInlineSnapshot(`
		[
		  "UTC 09:00 | delivered never | now 2025-01-15T10:00:00Z -> false",
		  "UTC 09:00 | delivered 2025-01-14T09:00:00Z | now 2025-01-15T10:00:00Z -> false",
		  "UTC 09:00 | delivered 2025-01-15T09:30:00Z | now 2025-01-15T10:00:00Z -> true",
		  "UTC 09:00 | delivered 2025-01-15T09:00:00Z | now 2025-01-15T10:00:00Z -> true",
		  "UTC 09:00 | delivered 2025-01-15T08:00:00Z | now 2025-01-15T10:00:00Z -> false",
		  "UTC 09:00 | delivered 2025-01-14T09:00:00Z | now 2025-01-15T09:00:00Z -> false",
		  "UTC 09:00 | delivered 2025-01-15T09:00:00Z | now 2025-01-15T18:00:00Z -> true",
		  "America/New_York 09:00 | delivered 2025-01-15T14:30:00Z | now 2025-01-15T15:00:00Z -> true",
		  "America/New_York 09:00 | delivered 2025-01-15T03:00:00Z | now 2025-01-15T15:00:00Z -> false",
		]
	`)
})

function describeSettings(settings: NotificationTimeSettings) {
	return `${settings.timezone} ${settings.notificationTime ?? "(default)"}`
}
