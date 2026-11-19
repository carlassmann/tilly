import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { getPersonDetails, listPeople } from "#shared/tools/person-read"
import { updatePerson } from "#shared/tools/person-update"
import {
	redactNoise,
	createAccount,
	seedNote,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"

function describePeople({ people }: Awaited<ReturnType<typeof listPeople>>) {
	return people.map(p => `${p.name}${p.deletedAt ? " · deleted" : ""}`)
}

describe("listPeople", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
		await seedPerson(owner, { name: "Active" })
	})

	async function seedDeletedPerson() {
		let deleted = await seedPerson(owner, { name: "Deleted" })
		await updatePerson(owner, {
			personId: deleted.$jazz.id,
			deletedAt: new Date(),
		})
	}

	test("returns active people, hides deleted by default", async () => {
		await seedDeletedPerson()
		let result = await listPeople(owner, { includeDeleted: false })
		expect(describePeople(result)).toEqual(["Active"])
	})

	test("includeDeleted returns both", async () => {
		await seedDeletedPerson()
		let result = await listPeople(owner, { includeDeleted: true })
		expect(describePeople(result)).toEqual(["Active", "Deleted · deleted"])
	})

	test("search filters by name and summary", async () => {
		await seedPerson(owner, { name: "Ada Lovelace" })
		await seedPerson(owner, { name: "Grace Hopper", summary: "compilers" })
		await seedPerson(owner, { name: "Random", summary: "ada is here too" })

		let byName = await listPeople(owner, {
			search: "grace",
			includeDeleted: false,
		})
		let bySummary = await listPeople(owner, {
			search: "compilers",
			includeDeleted: false,
		})
		expect(describePeople(byName)).toEqual(["Grace Hopper"])
		expect(describePeople(bySummary)).toEqual(["Grace Hopper"])
	})
})

describe("getPersonDetails", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	async function readDetails(personId: string, search?: string) {
		return await getPersonDetails(owner, {
			personId,
			search,
			includeDeletedNotes: false,
			includeDeletedReminders: false,
		})
	}

	test("returns the person with notes and reminders", async () => {
		let person = await seedPerson(owner, {
			name: "Ada",
			summary: "math friend",
		})
		await seedNote(person, { content: "note one" })
		await seedNote(person, { content: "note two" })
		await seedReminder(person, { text: "ping", dueAtDate: "2099-01-01" })

		let result = await readDetails(person.$jazz.id)
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "name": "Ada",
			  "notes": [
			    {
			      "content": "note one",
			      "createdAt": "<time>",
			      "id": "<id>",
			      "pinned": false,
			      "title": "",
			      "updatedAt": "<time>",
			    },
			    {
			      "content": "note two",
			      "createdAt": "<time>",
			      "id": "<id>",
			      "pinned": false,
			      "title": "",
			      "updatedAt": "<time>",
			    },
			  ],
			  "personId": "<id>",
			  "reminders": [
			    {
			      "createdAt": "<time>",
			      "dueAtDate": "2099-01-01",
			      "id": "<id>",
			      "text": "ping",
			      "updatedAt": "<time>",
			    },
			  ],
			  "summary": "math friend",
			}
		`)
	})

	test("hides soft-deleted notes by default", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await seedNote(person, { content: "kept" })
		await seedNote(person, { content: "gone", deletedAt: new Date() })

		let result = await readDetails(person.$jazz.id)
		expect(result.notes.map(n => n.content)).toEqual(["kept"])
	})

	test("search filters notes and reminders", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await seedNote(person, { content: "needle in haystack" })
		await seedNote(person, { content: "unrelated" })
		await seedReminder(person, {
			text: "needle ping",
			dueAtDate: "2099-01-01",
		})
		await seedReminder(person, { text: "other ping", dueAtDate: "2099-01-01" })

		let result = await readDetails(person.$jazz.id, "needle")
		expect(result.notes.map(n => n.content)).toEqual(["needle in haystack"])
		expect(result.reminders.map(r => r.text)).toEqual(["needle ping"])
	})

	test("throws when person not found", async () => {
		await expect(readDetails("co_zNope")).rejects.toBeDefined()
	})
})
