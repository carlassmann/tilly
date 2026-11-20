import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Note, Person, UserAccount } from "#shared/schema/user"
import { createNote } from "#shared/tools/note-create"
import {
	redactNoise,
	createAccount,
	seedPerson,
} from "#shared/tools/test-helpers"

async function storedNotes(person: co.loaded<typeof Person>) {
	let loaded = await person.$jazz.ensureLoaded({
		resolve: { notes: { $each: true } },
	})
	return loaded.notes
}

describe("createNote", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("attaches a note to the person's notes list", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createNote(owner, {
			personId: person.$jazz.id,
			content: "first note",
		})
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "current": {
			    "content": "first note",
			    "createdAt": "<time>",
			    "noteId": "<id:1>",
			    "personId": "<id:2>",
			    "pinned": false,
			    "updatedAt": "<time>",
			  },
			  "operation": "create",
			}
		`)
		// eslint-disable-next-line architecture/expect-tests-only -- invariant: the note links back to the person it was created for
		expect(result.current.personId).toBe(person.$jazz.id)

		let stored = (await storedNotes(person)).map(n => ({
			id: n.$jazz.id,
			content: n.content,
		}))
		expect(redactNoise({ created: result.current.noteId, stored }))
			.toMatchInlineSnapshot(`
			{
			  "created": "<id:1>",
			  "stored": [
			    {
			      "content": "first note",
			      "id": "<id:1>",
			    },
			  ],
			}
		`)
	})

	test("content survives a reload via Note.load", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createNote(owner, {
			personId: person.$jazz.id,
			content: "persisted",
			pinned: true,
			title: "T",
		})

		let note = await Note.load(result.current.noteId)
		expect(
			note.$isLoaded &&
				`${note.title} · ${note.content} · pinned=${note.pinned}`,
		).toMatchInlineSnapshot(`"T · persisted · pinned=true"`)
	})

	test("bumps the person's updatedAt", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		let before = person.updatedAt.getTime()

		await new Promise(r => setTimeout(r, 5))
		await createNote(owner, {
			personId: person.$jazz.id,
			content: "x",
		})

		// eslint-disable-next-line architecture/expect-tests-only -- invariant: any edit moves the person's updatedAt forward
		expect(person.updatedAt.getTime()).toBeGreaterThan(before)
	})

	test("throws when the person does not exist", async () => {
		await expect(
			createNote(owner, {
				personId: "co_zNonExistent",
				content: "x",
			}),
		).rejects.toThrow("person not found")
	})

	describe("multi-user", () => {
		let collaborator: co.loaded<typeof UserAccount>

		beforeEach(async () => {
			collaborator = await createAccount()
		})

		test("a writer collaborator can create a note on the shared person", async () => {
			let person = await seedPerson(owner, {
				name: "Shared Ada",
				sharedWith: collaborator,
			})
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)
			let result = await createNote(collaborator, {
				personId: person.$jazz.id,
				content: "from collaborator",
			})
			await collaborator.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let stored = await storedNotes(person)
			expect([
				`returned: ${result.current.content}`,
				...stored.map(n => `owner sees: ${n.content}`),
			]).toMatchInlineSnapshot(`
				[
				  "returned: from collaborator",
				  "owner sees: from collaborator",
				]
			`)
		})

		test("a non-member cannot load the person, createNote rejects", async () => {
			let person = await seedPerson(owner, { name: "Private Ada" })
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)

			await expect(
				createNote(collaborator, {
					personId: person.$jazz.id,
					content: "should fail",
				}),
			).rejects.toThrow("person not found")
		})
	})
})
