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
	let deletedAt = new Date("2025-03-01")
	let deleted = await seedReminder(person, {
		text: "old",
		dueAtDate: "2025-02-01",
		deletedAt,
	})
	let active = await seedReminder(person, {
		text: "active",
		dueAtDate: "2025-06-01",
	})
	let referenceDate = getReferenceDate(active)
	expect({
		referenceDateIsUpdatedAt:
			referenceDate.getTime() === active.updatedAt?.getTime(),
		referenceDateIsDate: referenceDate instanceof Date,
		deletedDateOfDeleted: getDeletedDate(deleted).toISOString(),
		deletedDateOfActiveIsReferenceDate:
			getDeletedDate(active).getTime() === referenceDate.getTime(),
	}).toMatchInlineSnapshot(`
		{
		  "deletedDateOfActiveIsReferenceDate": true,
		  "deletedDateOfDeleted": "2025-03-01T00:00:00.000Z",
		  "referenceDateIsDate": true,
		  "referenceDateIsUpdatedAt": true,
		}
	`)
})
