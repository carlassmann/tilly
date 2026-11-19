import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { Person, Reminder, UserAccount } from "#shared/schema/user"
import { updateReminder } from "#shared/tools/reminder-update"
import {
	redactNoise,
	createAccount,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"

describe("updateReminder", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("edits text and dueAtDate, returns previous + current", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "old",
			dueAtDate: "2099-01-01",
		})

		let result = await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			text: "new",
			dueAtDate: "2099-02-01",
		})
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "current": {
			    "createdAt": "<time>",
			    "done": false,
			    "dueAtDate": "2099-02-01",
			    "personId": "<id>",
			    "reminderId": "<id>",
			    "text": "new",
			    "updatedAt": "<time>",
			  },
			  "operation": "update",
			  "previous": {
			    "createdAt": "<time>",
			    "done": false,
			    "dueAtDate": "2099-01-01",
			    "personId": "<id>",
			    "reminderId": "<id>",
			    "text": "old",
			    "updatedAt": "<time>",
			  },
			}
		`)
	})

	test("mark done (non-repeating) moves to inactiveReminders", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "do it",
			dueAtDate: "2099-01-01",
		})

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})
		expect(await reminderListsOf(person)).toMatchInlineSnapshot(`
			{
			  "active": [],
			  "inactive": [
			    "do it · 2099-01-01 · done",
			  ],
			}
		`)
	})

	test("mark done (repeating) reschedules to next occurrence and stays active", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "weekly call",
			dueAtDate: "2099-01-01",
			repeat: { interval: 1, unit: "week" },
		})

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})
		expect(await reminderListsOf(person)).toMatchInlineSnapshot(`
			{
			  "active": [
			    "weekly call · 2099-01-08",
			  ],
			  "inactive": [],
			}
		`)
	})

	test("undone restores from inactive to active", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "x",
			dueAtDate: "2099-01-01",
		})
		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: false,
		})
		expect(await reminderListsOf(person)).toMatchInlineSnapshot(`
			{
			  "active": [
			    "x · 2099-01-01",
			  ],
			  "inactive": [],
			}
		`)
	})

	test("soft delete moves to inactive, restore moves back", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "x",
			dueAtDate: "2099-01-01",
		})

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			deletedAt: new Date(),
		})
		let afterDelete = await reminderListsOf(person)

		await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			deletedAt: undefined,
		})
		let afterRestore = await reminderListsOf(person)

		expect({ afterDelete, afterRestore }).toMatchInlineSnapshot(`
			{
			  "afterDelete": {
			    "active": [],
			    "inactive": [
			      "x · 2099-01-01 · deleted",
			    ],
			  },
			  "afterRestore": {
			    "active": [
			      "x · 2099-01-01",
			    ],
			    "inactive": [],
			  },
			}
		`)
	})

	test("throws when reminder not found", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await expect(
			updateReminder(owner, {
				personId: person.$jazz.id,
				reminderId: "co_zNope",
				text: "x",
			}),
		).rejects.toBeDefined()
	})

	test("repeat unit month advances by one month", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let reminder = await seedReminder(person, {
			text: "monthly",
			dueAtDate: "2099-01-15",
			repeat: { interval: 1, unit: "month" },
		})

		let result = await updateReminder(owner, {
			personId: person.$jazz.id,
			reminderId: reminder.$jazz.id,
			done: true,
		})
		expect(result.current.dueAtDate).toBe("2099-02-15")

		let reloaded = await Reminder.load(reminder.$jazz.id)
		expect(reloaded?.$isLoaded ? reloaded.dueAtDate : null).toBe("2099-02-15")
	})
})

async function reminderListsOf(person: co.loaded<typeof Person>) {
	let loaded = await person.$jazz.ensureLoaded({
		resolve: {
			reminders: { $each: true },
			inactiveReminders: { $each: true },
		},
	})
	let describeReminder = (r: co.loaded<typeof Reminder>) =>
		`${r.text} · ${r.dueAtDate}${r.done ? " · done" : ""}${r.deletedAt ? " · deleted" : ""}`
	return {
		active: loaded.reminders.map(describeReminder),
		inactive: (loaded.inactiveReminders ?? []).map(describeReminder),
	}
}
