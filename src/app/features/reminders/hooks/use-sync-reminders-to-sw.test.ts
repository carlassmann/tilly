import { expect, test } from "vitest"
import {
	createAccount,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"
import { extractRemindersForSync } from "./use-sync-reminders-to-sw"

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
	let table = []
	for (let scenario of cases) {
		let account = await createAccount({ isCurrentActive: true })
		let seededNames = new Map<string, string>()
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
				seededNames.set(reminder.$jazz.id, person.name)
			}
		}
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: { reminders: { $each: true } } } } },
		})
		let reminders = extractRemindersForSync(root.people.values()).map(
			({ id, dueAtDate }) => `${seededNames.get(id) ?? id} ${dueAtDate}`,
		)
		table.push(`${scenario.name} -> [${reminders.join(", ")}]`)
	}
	expect(table).toMatchInlineSnapshot(`
		[
		  "active reminder -> [Person 1 2025-01-15]",
		  "done reminder -> []",
		  "deleted reminder -> []",
		  "deleted person -> []",
		  "multiple people -> [Person 1 2025-01-15, Person 2 2025-01-20]",
		]
	`)
})
