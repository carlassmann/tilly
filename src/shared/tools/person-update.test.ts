import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Person, UserAccount } from "#shared/schema/user"
import { updatePerson } from "#shared/tools/person-update"
import {
	redactNoise,
	createAccount,
	seedPerson,
} from "#shared/tools/test-helpers"

describe("updatePerson", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	async function setPersonDeletedAt(personId: string, deletedAt?: Date) {
		await updatePerson(owner, { personId, deletedAt })
	}

	async function namesByList() {
		let { root } = await owner.$jazz.ensureLoaded({
			resolve: {
				root: { people: { $each: true }, inactivePeople: { $each: true } },
			},
		})
		return {
			active: root.people.map(p => p.name),
			inactive: root.inactivePeople?.map(p => p.name),
		}
	}

	test("updates name and summary, returns previous + current", async () => {
		let person = await seedPerson(owner, {
			name: "Ada",
			summary: "old summary",
		})

		let result = await updatePerson(owner, {
			personId: person.$jazz.id,
			name: "Ada L.",
			summary: "new summary",
		})
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "current": {
			    "createdAt": "<time>",
			    "name": "Ada L.",
			    "personId": "<id>",
			    "summary": "new summary",
			    "updatedAt": "<time>",
			  },
			  "operation": "update",
			  "previous": {
			    "createdAt": "<time>",
			    "name": "Ada",
			    "personId": "<id>",
			    "summary": "old summary",
			    "updatedAt": "<time>",
			  },
			}
		`)
	})

	test("partial update leaves untouched fields", async () => {
		let person = await seedPerson(owner, {
			name: "Ada",
			summary: "keep this",
		})

		let result = await updatePerson(owner, {
			personId: person.$jazz.id,
			name: "Ada L.",
		})
		expect(result.current.summary).toBe("keep this")
	})

	test("soft delete moves person from active to inactivePeople", async () => {
		let person = await seedPerson(owner, { name: "Bye" })

		await setPersonDeletedAt(person.$jazz.id, new Date())
		expect(await namesByList()).toEqual({ active: [], inactive: ["Bye"] })
	})

	test("restore moves back from inactivePeople to active", async () => {
		let person = await seedPerson(owner, { name: "Back" })
		await setPersonDeletedAt(person.$jazz.id, new Date())

		await setPersonDeletedAt(person.$jazz.id, undefined)
		expect(await namesByList()).toEqual({ active: ["Back"], inactive: [] })
	})

	test("throws when person not found", async () => {
		await expect(
			updatePerson(owner, { personId: "co_zNope", name: "x" }),
		).rejects.toBeDefined()
	})

	describe("multi-user", () => {
		test("collaborator edit is visible to owner after sync", async () => {
			let collaborator = await createAccount()
			let person = await seedPerson(owner, {
				name: "Shared",
				sharedWith: collaborator,
			})
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)
			await updatePerson(collaborator, {
				personId: person.$jazz.id,
				name: "Edited by other",
			})
			await collaborator.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let reloaded = await Person.load(person.$jazz.id)
			expect(reloaded?.$isLoaded ? reloaded.name : null).toBe("Edited by other")
		})
	})
})
