import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import type { co } from "jazz-tools"
import { Reminder, UserAccount } from "#shared/schema/user"
import { createReminder } from "#shared/tools/reminder-create"
import {
	redactNoise,
	createAccount,
	seedPerson,
} from "#shared/tools/test-helpers"

function describeStored(
	reminder: { $jazz: { id: string }; text: string },
	createdId: string,
) {
	return `${reminder.$jazz.id === createdId ? "created" : "other"}: ${reminder.text}`
}

describe("createReminder", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("attaches a reminder with text + dueAtDate", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createReminder(owner, {
			personId: person.$jazz.id,
			text: "call back",
			dueAtDate: "2099-01-01",
		})
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "current": {
			    "createdAt": "<time>",
			    "done": false,
			    "dueAtDate": "2099-01-01",
			    "personId": "<id>",
			    "reminderId": "<id>",
			    "text": "call back",
			    "updatedAt": "<time>",
			  },
			  "operation": "create",
			}
		`)

		let loaded = await person.$jazz.ensureLoaded({
			resolve: { reminders: { $each: true } },
		})
		expect(
			loaded.reminders
				.map(r => describeStored(r, result.current.reminderId))
				.join(", "),
		).toMatchInlineSnapshot(`"created: call back"`)
	})

	test("persists repeat config", async () => {
		let person = await seedPerson(owner, { name: "Ada" })

		let result = await createReminder(owner, {
			personId: person.$jazz.id,
			text: "weekly",
			dueAtDate: "2099-01-01",
			repeat: { interval: 1, unit: "week" },
		})

		let reloaded = await Reminder.load(result.current.reminderId)
		if (!reloaded?.$isLoaded) throw new Error("reminder not loaded")
		let { interval, unit } = reloaded.repeat ?? {}
		expect(`every ${interval} ${unit}`).toMatchInlineSnapshot(`"every 1 week"`)
	})

	test("throws when person not found", async () => {
		await expect(
			createReminder(owner, {
				personId: "co_zNope",
				text: "x",
				dueAtDate: "2099-01-01",
			}),
		).rejects.toThrow("person not found")
	})

	describe("multi-user", () => {
		test("writer collaborator can create on shared person", async () => {
			let collaborator = await createAccount()
			let person = await seedPerson(owner, {
				name: "Shared",
				sharedWith: collaborator,
			})
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(collaborator)
			let result = await createReminder(collaborator, {
				personId: person.$jazz.id,
				text: "from other",
				dueAtDate: "2099-01-01",
			})
			await collaborator.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let loaded = await person.$jazz.ensureLoaded({
				resolve: { reminders: { $each: true } },
			})
			expect(
				loaded.reminders
					.map(r => describeStored(r, result.current.reminderId))
					.join(", "),
			).toMatchInlineSnapshot(`"created: from other"`)
		})
	})
})
