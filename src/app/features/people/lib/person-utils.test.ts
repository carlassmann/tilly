import { expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import { Person } from "#shared/schema/user"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"
import { isPersonAdmin, getPersonOwnerName } from "./person-utils"

test("isPersonAdmin", async () => {
	let owner = await createAccount({ isCurrentActive: true })
	let person = await seedPerson(owner, { name: "Ada" })
	let table = [`admin creator -> ${isPersonAdmin(person)}`]
	let collaborator = await createAccount()
	let shared = await seedPerson(owner, {
		name: "Shared",
		sharedWith: collaborator,
	})
	await owner.$jazz.waitForAllCoValuesSync()
	setActiveAccount(collaborator)
	let loaded = await Person.load(shared.$jazz.id)
	expect(loaded?.$isLoaded).toBe(true)
	if (!loaded?.$isLoaded) return
	table.push(`writer collaborator -> ${isPersonAdmin(loaded)}`)
	expect(table).toMatchInlineSnapshot(`
		[
		  "admin creator -> true",
		  "writer collaborator -> false",
		]
	`)
})

test("getPersonOwnerName returns the admin's profile name for a group-owned person", async () => {
	let owner = await createAccount({ isCurrentActive: true })
	let person = await seedPerson(owner, { name: "Ada" })
	let name = await getPersonOwnerName(person)
	expect(typeof name).toBe("string")
})
