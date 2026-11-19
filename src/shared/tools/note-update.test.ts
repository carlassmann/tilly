import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Note, Person, UserAccount } from "#shared/schema/user"
import { updateNote } from "#shared/tools/note-update"
import {
	redactNoise,
	createAccount,
	seedNote,
	seedPerson,
} from "#shared/tools/test-helpers"

async function contentsByList(person: co.loaded<typeof Person>) {
	let loaded = await person.$jazz.ensureLoaded({
		resolve: { notes: { $each: true }, inactiveNotes: { $each: true } },
	})
	let active = loaded.notes.map(n => n.content)
	let inactive = loaded.inactiveNotes?.map(n => n.content) ?? []
	return `active: [${active.join(", ")}] · inactive: [${inactive.join(", ")}]`
}

async function storedContent(noteId: string) {
	let note = await Note.load(noteId)
	return note.$isLoaded ? note.content : note.$jazz.loadingState
}

describe("updateNote", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	async function setNoteDeletedAt(
		person: co.loaded<typeof Person>,
		noteId: string,
		deletedAt: Date | undefined,
	) {
		await updateNote(owner, { personId: person.$jazz.id, noteId, deletedAt })
	}

	test("edits content and returns previous + current", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "before" })

		let result = await updateNote(owner, {
			personId: person.$jazz.id,
			noteId: note.$jazz.id,
			content: "after",
		})
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "current": {
			    "content": "after",
			    "createdAt": "<time>",
			    "noteId": "<id>",
			    "personId": "<id>",
			    "pinned": false,
			    "updatedAt": "<time>",
			  },
			  "operation": "update",
			  "previous": {
			    "content": "before",
			    "createdAt": "<time>",
			    "noteId": "<id>",
			    "personId": "<id>",
			    "pinned": false,
			    "updatedAt": "<time>",
			  },
			}
		`)
		expect(await storedContent(note.$jazz.id)).toMatchInlineSnapshot(`"after"`)
	})

	test("toggle pin", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "x", pinned: false })

		let result = await updateNote(owner, {
			personId: person.$jazz.id,
			noteId: note.$jazz.id,
			pinned: true,
		})
		expect(
			`pinned ${result.previous.pinned} -> ${result.current.pinned}`,
		).toMatchInlineSnapshot(`"pinned false -> true"`)
	})

	test("soft delete moves note from notes to inactiveNotes", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "delete me" })

		await setNoteDeletedAt(person, note.$jazz.id, new Date())
		expect(await contentsByList(person)).toMatchInlineSnapshot(
			`"active: [] · inactive: [delete me]"`,
		)
	})

	test("restore moves note back from inactiveNotes", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let note = await seedNote(person, { content: "restore me" })
		await setNoteDeletedAt(person, note.$jazz.id, new Date())

		await setNoteDeletedAt(person, note.$jazz.id, undefined)
		expect(await contentsByList(person)).toMatchInlineSnapshot(
			`"active: [restore me] · inactive: []"`,
		)
	})

	test("throws when note not found", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await expect(
			updateNote(owner, {
				personId: person.$jazz.id,
				noteId: "co_zNope",
				content: "x",
			}),
		).rejects.toThrow("note not found")
	})

	describe("multi-user", () => {
		test("collaborator edit visible to owner", async () => {
			let collaborator = await createAccount()
			let person = await seedPerson(owner, {
				name: "Shared",
				sharedWith: collaborator,
			})
			let note = await seedNote(person, { content: "original" })
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)
			await updateNote(collaborator, {
				personId: person.$jazz.id,
				noteId: note.$jazz.id,
				content: "edited remotely",
			})
			await collaborator.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			expect(await storedContent(note.$jazz.id)).toMatchInlineSnapshot(
				`"edited remotely"`,
			)
		})
	})
})
