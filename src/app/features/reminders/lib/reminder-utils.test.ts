import { test, expect } from "vitest"
import { findLatestFutureDate } from "./reminder-utils"

test("findLatestFutureDate returns the latest open reminder due today or later", () => {
	let today = "2025-01-15"
	let reminder = (dueAtDate: string, flag?: "deleted" | "done") => ({
		dueAtDate,
		deleted: flag === "deleted",
		done: flag === "done",
	})
	let cases = {
		"empty list": [],
		"all in the past": [reminder("2025-01-10"), reminder("2025-01-14")],
		"only future": [reminder("2025-01-20")],
		"due today": [reminder("2025-01-15")],
		"multiple future": [
			reminder("2025-01-20"),
			reminder("2025-02-15"),
			reminder("2025-01-25"),
		],
		"later one deleted": [
			reminder("2025-02-15", "deleted"),
			reminder("2025-01-20"),
		],
		"later one done": [reminder("2025-02-15", "done"), reminder("2025-01-20")],
		"all future deleted or done": [
			reminder("2025-02-15", "deleted"),
			reminder("2025-01-20", "done"),
			reminder("2025-01-10"),
		],
	}
	let table = Object.entries(cases).map(
		([label, reminders]) =>
			`${label} → ${findLatestFutureDate(reminders, today) ?? "undefined"}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "empty list → undefined",
		  "all in the past → undefined",
		  "only future → 2025-01-20",
		  "due today → 2025-01-15",
		  "multiple future → 2025-02-15",
		  "later one deleted → 2025-01-20",
		  "later one done → 2025-01-20",
		  "all future deleted or done → undefined",
		]
	`)
})
