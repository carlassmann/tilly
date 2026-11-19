import { expect, test } from "vitest"
import { co } from "jazz-tools"
import { Person } from "#shared/schema/user"
import {
	createAccount,
	redactNoise,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"

function extractRemindersForSync(
	people: Iterable<co.loaded<
		typeof Person,
		{ reminders: { $each: true } }
	> | null>,
	isDeleted: (item: { deletedAt?: Date }) => boolean,
): { id: string; dueAtDate: string }[] {
	let reminders: { id: string; dueAtDate: string }[] = []

	for (let person of people) {
		if (!person?.reminders || isDeleted(person)) continue
		for (let reminder of person.reminders.values()) {
			if (!reminder || reminder.done || isDeleted(reminder)) continue
			reminders.push({ id: reminder.$jazz.id, dueAtDate: reminder.dueAtDate })
		}
	}

	return reminders
}

test("extractRemindersForSync", async () => {
	let cases: {
		name: string
		people: {
			deleted?: boolean
			reminders: { dueAtDate: string; done?: boolean; deleted?: boolean }[]
		}[]
	}[] = [
		{
			name: "active reminder",
			people: [{ reminders: [{ dueAtDate: "2025-01-15" }] }],
		},
		{
			name: "done reminder",
			people: [{ reminders: [{ dueAtDate: "2025-01-15", done: true }] }],
		},
		{
			name: "deleted reminder",
			people: [{ reminders: [{ dueAtDate: "2025-01-15", deleted: true }] }],
		},
		{
			name: "deleted person",
			people: [{ deleted: true, reminders: [{ dueAtDate: "2025-01-15" }] }],
		},
		{
			name: "multiple people",
			people: [
				{ reminders: [{ dueAtDate: "2025-01-15" }] },
				{ reminders: [{ dueAtDate: "2025-01-20" }] },
			],
		},
	]
	let results = []
	for (let scenario of cases) {
		let account = await createAccount({ isCurrentActive: true })
		let activeReminders = []
		for (let [index, fixture] of scenario.people.entries()) {
			let person = await seedPerson(account, { name: `Person ${index + 1}` })
			if (fixture.deleted) person.$jazz.set("deletedAt", new Date())
			for (let reminderFixture of fixture.reminders) {
				let reminder = await seedReminder(person, {
					text: "Call them",
					dueAtDate: reminderFixture.dueAtDate,
					done: reminderFixture.done,
					deletedAt: reminderFixture.deleted ? new Date() : undefined,
				})
				if (
					!fixture.deleted &&
					!reminderFixture.done &&
					!reminderFixture.deleted
				) {
					activeReminders.push({
						id: reminder.$jazz.id,
						dueAtDate: reminder.dueAtDate,
					})
				}
			}
		}
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})
		let reminders = extractRemindersForSync(
			root.people.values(),
			item => !!item.deletedAt,
		)
		expect(reminders, scenario.name).toEqual(activeReminders)
		results.push({ scenario: scenario.name, reminders })
	}
	expect(redactNoise(results)).toMatchInlineSnapshot(`
		[
		  {
		    "reminders": [
		      {
		        "dueAtDate": "2025-01-15",
		        "id": "<id>",
		      },
		    ],
		    "scenario": "active reminder",
		  },
		  {
		    "reminders": [],
		    "scenario": "done reminder",
		  },
		  {
		    "reminders": [],
		    "scenario": "deleted reminder",
		  },
		  {
		    "reminders": [],
		    "scenario": "deleted person",
		  },
		  {
		    "reminders": [
		      {
		        "dueAtDate": "2025-01-15",
		        "id": "<id>",
		      },
		      {
		        "dueAtDate": "2025-01-20",
		        "id": "<id>",
		      },
		    ],
		    "scenario": "multiple people",
		  },
		]
	`)
})
