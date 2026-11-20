import { expect, test } from "vitest"
import {
	createAccount,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"
import { getReferenceDate, getDeletedDate } from "./reminder-dates"

test("getReferenceDate and getDeletedDate", async () => {
	let owner = await createAccount({ isCurrentActive: true })
	let person = await seedPerson(owner, { name: "Ada" })
	let createdAt = new Date("2025-01-01")
	let updatedAt = new Date("2025-01-15")
	let deleted = await seedReminder(person, {
		text: "old",
		dueAtDate: "2025-02-01",
		deletedAt: new Date("2025-03-01"),
		createdAt,
		updatedAt,
	})
	let active = await seedReminder(person, {
		text: "active",
		dueAtDate: "2025-06-01",
		createdAt,
		updatedAt,
	})
	expect({
		referenceDateOfActive: getReferenceDate(active),
		deletedDateOfDeleted: getDeletedDate(deleted),
		deletedDateOfActive: getDeletedDate(active),
	}).toMatchInlineSnapshot(`
		{
		  "deletedDateOfActive": 2025-01-15T00:00:00.000Z,
		  "deletedDateOfDeleted": 2025-03-01T00:00:00.000Z,
		  "referenceDateOfActive": 2025-01-15T00:00:00.000Z,
		}
	`)
})
