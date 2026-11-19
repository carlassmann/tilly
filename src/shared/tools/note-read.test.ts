import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { Person, UserAccount } from "#shared/schema/user"
import { listNotes } from "#shared/tools/note-read"
import { updateNote } from "#shared/tools/note-update"
import {
	redactNoise,
	createAccount,
	seedNote,
	seedPerson,
} from "#shared/tools/test-helpers"

function describeNotes({ notes }: Awaited<ReturnType<typeof listNotes>>) {
	return notes.map(
		n =>
			`${n.content} · ${n.person.name}${n.pinned ? " · pinned" : ""}${n.deleted ? " · deleted" : ""}`,
	)
}

describe("listNotes", () => {
	let owner: co.loaded<typeof UserAccount>
	let seededNoteCount = 0

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
		seededNoteCount = 0
	})

	// Notes seeded in the same millisecond would sort nondeterministically.
	async function seedNoteInOrder(
		person: co.loaded<typeof Person>,
		args: Omit<Parameters<typeof seedNote>[1], "createdAt">,
	) {
		seededNoteCount++
		let createdAt = new Date(Date.UTC(2025, 0, 1, 12, 0, seededNoteCount))
		return await seedNote(person, { ...args, createdAt })
	}

	async function softDelete(person: co.loaded<typeof Person>, noteId: string) {
		await updateNote(owner, {
			personId: person.$jazz.id,
			noteId,
			deletedAt: new Date(),
		})
	}

	test("returns notes across people, hides deleted by default", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedNoteInOrder(ada, { content: "ada-1" })
		await seedNoteInOrder(grace, { content: "grace-1" })
		let gone = await seedNoteInOrder(ada, { content: "gone" })
		await softDelete(ada, gone.$jazz.id)

		let result = await listNotes(owner, { includeDeleted: false })
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "filteredCount": 2,
			  "notes": [
			    {
			      "content": "grace-1",
			      "createdAt": "<time>",
			      "deleted": false,
			      "id": "<id>",
			      "person": {
			        "id": "<id>",
			        "name": "Grace",
			      },
			      "pinned": false,
			      "title": "",
			      "updatedAt": "<time>",
			    },
			    {
			      "content": "ada-1",
			      "createdAt": "<time>",
			      "deleted": false,
			      "id": "<id>",
			      "person": {
			        "id": "<id>",
			        "name": "Ada",
			      },
			      "pinned": false,
			      "title": "",
			      "updatedAt": "<time>",
			    },
			  ],
			  "operation": "list",
			  "totalCount": 2,
			}
		`)
	})

	test("pinned notes appear first", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedNoteInOrder(ada, { content: "regular-1" })
		await seedNoteInOrder(ada, { content: "pinned-1", pinned: true })
		await seedNoteInOrder(ada, { content: "regular-2" })

		let result = await listNotes(owner, { includeDeleted: false })
		expect(describeNotes(result)).toEqual([
			"pinned-1 · Ada · pinned",
			"regular-2 · Ada",
			"regular-1 · Ada",
		])
	})

	test("search filters by content, title, person name", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedNoteInOrder(ada, { content: "needle here" })
		await seedNoteInOrder(ada, { content: "boring", title: "needle title" })
		await seedNoteInOrder(grace, { content: "plain" })

		async function search(searchQuery: string) {
			let result = await listNotes(owner, {
				searchQuery,
				includeDeleted: false,
			})
			return describeNotes(result)
		}
		expect(await search("needle here")).toEqual(["needle here · Ada"])
		expect(await search("needle title")).toEqual(["boring · Ada"])
		expect(await search("grace")).toEqual(["plain · Grace"])
	})

	test("includeDeleted appends deleted notes at the end", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedNoteInOrder(ada, { content: "alive" })
		let dead = await seedNoteInOrder(ada, { content: "dead" })
		await softDelete(ada, dead.$jazz.id)

		let result = await listNotes(owner, { includeDeleted: true })
		expect(describeNotes(result)).toEqual([
			"alive · Ada",
			"dead · Ada · deleted",
		])
	})
})
