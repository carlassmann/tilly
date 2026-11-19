import { expect, test } from "vitest"
import { countDueReminders, interpolateCount } from "./sw-utils"

test("countDueReminders", () => {
	let cases: { name: string; dates: string[]; today: string }[] = [
		{ name: "empty reminders", dates: [], today: "2025-01-15" },
		{
			name: "due today",
			dates: ["2025-01-15", "2025-01-16"],
			today: "2025-01-15",
		},
		{
			name: "due in the past",
			dates: ["2025-01-10", "2025-01-14", "2025-01-15"],
			today: "2025-01-15",
		},
		{
			name: "future reminders",
			dates: ["2025-01-16", "2025-02-01"],
			today: "2025-01-15",
		},
		{
			name: "year boundary",
			dates: ["2024-12-31", "2025-01-01", "2025-01-02"],
			today: "2025-01-01",
		},
	]
	let table = cases.map(({ name, dates, today }) => {
		let reminders = dates.map(dueAtDate => ({ dueAtDate }))
		return `${name} | due ${dates.join(", ") || "none"} | today ${today} -> ${countDueReminders(reminders, today)}`
	})
	expect(table).toMatchInlineSnapshot(`
		[
		  "empty reminders | due none | today 2025-01-15 -> 0",
		  "due today | due 2025-01-15, 2025-01-16 | today 2025-01-15 -> 1",
		  "due in the past | due 2025-01-10, 2025-01-14, 2025-01-15 | today 2025-01-15 -> 3",
		  "future reminders | due 2025-01-16, 2025-02-01 | today 2025-01-15 -> 0",
		  "year boundary | due 2024-12-31, 2025-01-01, 2025-01-02 | today 2025-01-01 -> 2",
		]
	`)
})

test("interpolateCount", () => {
	let cases: [string, number][] = [
		["You have {count} reminders", 5],
		["You have {count} reminders", 1],
		["You have {count} reminders", 0],
		["No placeholder here", 5],
	]
	let table = cases.map(
		([template, count]) =>
			`${template} | count ${count} -> ${interpolateCount(template, count)}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "You have {count} reminders | count 5 -> You have 5 reminders",
		  "You have {count} reminders | count 1 -> You have 1 reminders",
		  "You have {count} reminders | count 0 -> You have 0 reminders",
		  "No placeholder here | count 5 -> No placeholder here",
		]
	`)
})
