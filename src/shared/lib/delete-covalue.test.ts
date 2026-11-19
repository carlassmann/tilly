import { beforeEach, describe, expect, test } from "vitest"
import { createJazzTestAccount } from "jazz-tools/testing"
import { co, Group } from "jazz-tools"
import { Person, Note, Reminder, UserAccount } from "#shared/schema/user"
import {
	permanentlyDeleteNote,
	permanentlyDeleteReminder,
	permanentlyDeletePerson,
} from "#shared/lib/delete-covalue"

describe("permanent deletion", () => {
	let group: Group
	let person: ReturnType<typeof Person.create>
	let notes: co.loaded<co.List<typeof Note>>
	let reminders: co.loaded<co.List<typeof Reminder>>

	beforeEach(async () => {
		let account = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: UserAccount,
		})
		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})
		group = Group.create()
		let now = new Date()
		notes = co.list(Note).create([], group)
		reminders = co.list(Reminder).create([], group)
		person = Person.create(
			{
				version: 1,
				name: "Test Person",
				notes,
				reminders,
				createdAt: now,
				updatedAt: now,
			},
			group,
		)
		root.people.$jazz.push(person)
	})

	function addNote(content: string) {
		let now = new Date()
		let note = Note.create(
			{ version: 1, content, createdAt: now, updatedAt: now },
			group,
		)
		notes.$jazz.push(note)
		return note
	}

	function addReminder(text: string) {
		let now = new Date()
		let reminder = Reminder.create(
			{
				version: 1,
				text,
				dueAtDate: now.toISOString(),
				done: false,
				createdAt: now,
				updatedAt: now,
			},
			group,
		)
		reminders.$jazz.push(reminder)
		return reminder
	}

	test("permanentlyDeleteNote makes only that note inaccessible", async () => {
		let deleted = addNote("Note 1")
		let kept = addNote("Note 2")

		await permanentlyDeleteNote(deleted)

		let loadedDeleted = await Note.load(deleted.$jazz.id)
		expect(loadedDeleted?.$jazz.loadingState).toBe("deleted")
		expect(loadedDeleted?.$isLoaded).toBe(false)
		let loadedKept = await Note.load(kept.$jazz.id)
		expect(loadedKept?.$isLoaded ? loadedKept.content : null).toBe("Note 2")
	})

	test("permanentlyDeleteReminder deletes a reminder", async () => {
		let reminder = addReminder("Test reminder")

		await permanentlyDeleteReminder(reminder)

		let loaded = await Reminder.load(reminder.$jazz.id)
		expect(loaded?.$jazz.loadingState).toBe("deleted")
	})

	test("permanentlyDeletePerson deletes the person with their notes and reminders", async () => {
		let note = addNote("Test note")
		let reminder = addReminder("Test reminder")

		await permanentlyDeletePerson(person)

		let loadedPerson = await Person.load(person.$jazz.id)
		let loadedNote = await Note.load(note.$jazz.id)
		let loadedReminder = await Reminder.load(reminder.$jazz.id)
		expect(loadedPerson?.$isLoaded).toBe(false)
		expect([
			`person: ${loadedPerson?.$jazz.loadingState}`,
			`note: ${loadedNote?.$jazz.loadingState}`,
			`reminder: ${loadedReminder?.$jazz.loadingState}`,
		]).toMatchInlineSnapshot(`
			[
			  "person: deleted",
			  "note: deleted",
			  "reminder: deleted",
			]
		`)
	})
})
