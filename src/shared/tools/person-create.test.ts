import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { Person, UserAccount } from "#shared/schema/user"
import { createPerson } from "#shared/tools/person-create"
import { redactNoise, createAccount } from "#shared/tools/test-helpers"

describe("createPerson", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("creates a person and appends to root.people", async () => {
		let result = await createPerson(owner, {
			name: "Ada Lovelace",
			summary: "mathematician",
		})
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "current": {
			    "createdAt": "<time>",
			    "name": "Ada Lovelace",
			    "personId": "<id>",
			    "summary": "mathematician",
			    "updatedAt": "<time>",
			  },
			  "operation": "create",
			}
		`)

		let { root } = await owner.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: true } } },
		})
		let describeStored = (p: (typeof root.people)[number]) =>
			`${p.$jazz.id === result.current.personId ? "created" : "other"}: ${p.name}`
		expect(root.people.map(describeStored).join(", ")).toMatchInlineSnapshot(
			`"created: Ada Lovelace"`,
		)
	})

	test("created person reloads from its ID with content intact", async () => {
		let result = await createPerson(owner, { name: "Grace" })

		let reloaded = await Person.load(result.current.personId)
		expect(reloaded.$isLoaded && reloaded.name).toMatchInlineSnapshot(`"Grace"`)
	})

	test("summary is optional", async () => {
		let result = await createPerson(owner, { name: "Anon" })
		expect(result.current.summary).toMatchInlineSnapshot(`undefined`)
	})
})
