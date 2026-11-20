import { test, expect } from "vitest"
import { isStaleRef } from "./stale-ref"

test("isStaleRef keeps refs synced within 30 days or with a reminder due today or later", () => {
	let now = new Date("2025-01-15T12:00:00Z")
	let cases: [lastSyncedAt: string, latestReminder: string | undefined][] = [
		["2025-01-14", undefined],
		["2024-12-17", undefined],
		["2024-12-15", undefined],
		["2024-12-15", "2025-01-10"],
		["2024-12-15", "2025-01-20"],
		["2024-12-15", "2025-01-15"],
		["2024-11-01", "2024-12-01"],
	]
	let table = cases.map(([syncedOn, reminder]) => {
		let stale = isStaleRef(new Date(`${syncedOn}T12:00:00Z`), reminder, now)
		return `synced ${syncedOn}, reminder ${reminder ?? "none"} → ${stale ? "stale" : "keep"}`
	})
	expect(table).toMatchInlineSnapshot(`
		[
		  "synced 2025-01-14, reminder none → keep",
		  "synced 2024-12-17, reminder none → keep",
		  "synced 2024-12-15, reminder none → stale",
		  "synced 2024-12-15, reminder 2025-01-10 → stale",
		  "synced 2024-12-15, reminder 2025-01-20 → keep",
		  "synced 2024-12-15, reminder 2025-01-15 → keep",
		  "synced 2024-11-01, reminder 2024-12-01 → stale",
		]
	`)
})
