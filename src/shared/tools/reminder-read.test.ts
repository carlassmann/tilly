import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { listReminders } from "#shared/tools/reminder-read"
import { updateReminder } from "#shared/tools/reminder-update"
import {
	redactNoise,
	createAccount,
	seedPerson,
	seedReminder,
} from "#shared/tools/test-helpers"

describe("listReminders", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("returns reminders across people, hides done and deleted by default", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedReminder(ada, { text: "ada-1", dueAtDate: "2099-01-01" })
		await seedReminder(grace, { text: "grace-1", dueAtDate: "2099-01-01" })
		let done = await seedReminder(ada, {
			text: "done-one",
			dueAtDate: "2099-01-01",
		})
		await updateReminder(owner, {
			personId: ada.$jazz.id,
			reminderId: done.$jazz.id,
			done: true,
		})

		let result = await listReminders(owner, {
			includeDone: false,
			includeDeleted: false,
		})
		expect(redactNoise(result)).toMatchInlineSnapshot(`
			{
			  "filteredCount": 2,
			  "operation": "list",
			  "reminders": [
			    {
			      "createdAt": "<time>",
			      "done": false,
			      "dueAtDate": "2099-01-01",
			      "id": "<id:1>",
			      "person": {
			        "id": "<id:2>",
			        "name": "Ada",
			      },
			      "text": "ada-1",
			      "updatedAt": "<time>",
			    },
			    {
			      "createdAt": "<time>",
			      "done": false,
			      "dueAtDate": "2099-01-01",
			      "id": "<id:3>",
			      "person": {
			        "id": "<id:4>",
			        "name": "Grace",
			      },
			      "text": "grace-1",
			      "updatedAt": "<time>",
			    },
			  ],
			  "totalCount": 2,
			}
		`)
	})

	test("dueOnly filters out reminders due in the future", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedReminder(ada, { text: "past", dueAtDate: "2000-01-01" })
		await seedReminder(ada, { text: "future", dueAtDate: "2099-01-01" })

		let result = await listReminders(owner, {
			dueOnly: true,
			includeDone: false,
			includeDeleted: false,
		})
		expect(summarize(result.reminders).join(", ")).toMatchInlineSnapshot(
			`"Ada: past · 2000-01-01"`,
		)
	})

	test("sorted by due date ascending", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		await seedReminder(ada, { text: "later", dueAtDate: "2099-12-31" })
		await seedReminder(ada, { text: "earlier", dueAtDate: "2099-01-01" })
		await seedReminder(ada, { text: "middle", dueAtDate: "2099-06-15" })

		let result = await listReminders(owner, {
			includeDone: false,
			includeDeleted: false,
		})
		expect(summarize(result.reminders)).toMatchInlineSnapshot(`
			[
			  "Ada: earlier · 2099-01-01",
			  "Ada: middle · 2099-06-15",
			  "Ada: later · 2099-12-31",
			]
		`)
	})

	test("search filters by reminder text and person name", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let grace = await seedPerson(owner, { name: "Grace" })
		await seedReminder(ada, {
			text: "needle ping",
			dueAtDate: "2099-01-01",
		})
		await seedReminder(ada, { text: "boring", dueAtDate: "2099-01-01" })
		await seedReminder(grace, { text: "plain", dueAtDate: "2099-01-01" })

		let byText = await listReminders(owner, {
			searchQuery: "needle",
			includeDone: false,
			includeDeleted: false,
		})
		let byPerson = await listReminders(owner, {
			searchQuery: "grace",
			includeDone: false,
			includeDeleted: false,
		})
		expect({
			byText: summarize(byText.reminders),
			byPerson: summarize(byPerson.reminders),
		}).toMatchInlineSnapshot(`
			{
			  "byPerson": [
			    "Grace: plain · 2099-01-01",
			  ],
			  "byText": [
			    "Ada: needle ping · 2099-01-01",
			  ],
			}
		`)
	})

	test("includeDone returns completed reminders", async () => {
		let ada = await seedPerson(owner, { name: "Ada" })
		let r = await seedReminder(ada, { text: "x", dueAtDate: "2099-01-01" })
		await updateReminder(owner, {
			personId: ada.$jazz.id,
			reminderId: r.$jazz.id,
			done: true,
		})

		let result = await listReminders(owner, {
			includeDone: true,
			includeDeleted: false,
		})
		expect(summarize(result.reminders).join(", ")).toMatchInlineSnapshot(
			`"Ada: x · 2099-01-01 · done"`,
		)
	})
})

type ListedReminder = Awaited<
	ReturnType<typeof listReminders>
>["reminders"][number]

function summarize(reminders: ListedReminder[]) {
	return reminders.map(
		r =>
			`${r.person.name}: ${r.text} · ${r.dueAtDate}${r.done ? " · done" : ""}`,
	)
}
