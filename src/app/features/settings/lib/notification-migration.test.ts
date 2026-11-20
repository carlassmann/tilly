import { describe, test, expect } from "vitest"
import {
	copyNotificationSettingsData,
	type NotificationSettingsInput,
} from "./notification-migration"

describe("copyNotificationSettingsData", () => {
	let device = (name: string, isEnabled: boolean) => ({
		isEnabled,
		deviceName: name,
		endpoint: `https://push.example.com/${name}`,
		keys: { p256dh: `key-${name}`, auth: `auth-${name}` },
	})

	test("copies all settings fields and every device", () => {
		let settings: NotificationSettingsInput = {
			version: 1,
			timezone: "America/New_York",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T14:00:00Z"),
			language: "de",
			latestReminderDueDate: "2025-02-01",
			pushDevices: [device("iPhone", true), device("iPad", false)],
		}
		// eslint-disable-next-line architecture/expect-tests-only -- invariant: migration must not lose any setting or device
		expect(copyNotificationSettingsData(settings, undefined)).toEqual(settings)
	})

	test("falls back to rootLanguage only when settings have no language", () => {
		let base: NotificationSettingsInput = { version: 1, pushDevices: [] }
		let withEnglish = { ...base, language: "en" as const }
		let fallback = copyNotificationSettingsData(base, "de").language
		let kept = copyNotificationSettingsData(withEnglish, "de").language
		expect(`no language -> ${fallback}, en -> ${kept}`).toMatchInlineSnapshot(
			`"no language -> de, en -> en"`,
		)
	})

	test("handles undefined optional fields", () => {
		let result = copyNotificationSettingsData({ pushDevices: [] }, undefined)
		expect(result).toMatchInlineSnapshot(`
			{
			  "language": undefined,
			  "lastDeliveredAt": undefined,
			  "latestReminderDueDate": undefined,
			  "notificationTime": undefined,
			  "pushDevices": [],
			  "timezone": undefined,
			  "version": 1,
			}
		`)
	})
})
