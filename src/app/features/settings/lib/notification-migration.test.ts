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

	test("copies all settings fields", () => {
		let settings: NotificationSettingsInput = {
			version: 1,
			timezone: "America/New_York",
			notificationTime: "09:00",
			lastDeliveredAt: new Date("2025-01-15T14:00:00Z"),
			language: "de",
			latestReminderDueDate: "2025-02-01",
			pushDevices: [device("iPhone", true)],
		}
		expect(copyNotificationSettingsData(settings, undefined)).toEqual(settings)
	})

	test("falls back to rootLanguage only when settings have no language", () => {
		let base: NotificationSettingsInput = { version: 1, pushDevices: [] }
		let withEnglish = { ...base, language: "en" as const }
		expect(copyNotificationSettingsData(base, "de").language).toBe("de")
		expect(copyNotificationSettingsData(withEnglish, "de").language).toBe("en")
	})

	test("copies multiple devices", () => {
		let pushDevices = [device("Device 1", true), device("Device 2", false)]
		let result = copyNotificationSettingsData({ pushDevices }, undefined)
		expect(result.pushDevices).toEqual(pushDevices)
	})

	test("handles undefined optional fields", () => {
		let result = copyNotificationSettingsData({ pushDevices: [] }, undefined)
		expect(result).toStrictEqual({
			version: 1,
			timezone: undefined,
			notificationTime: undefined,
			lastDeliveredAt: undefined,
			language: undefined,
			latestReminderDueDate: undefined,
			pushDevices: [],
		})
	})
})
