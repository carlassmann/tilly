import { beforeEach, describe, expect, test } from "vitest"
import { co } from "jazz-tools"
import { Note, Person, Reminder, UserAccount } from "#shared/schema/user"
import {
	createAccount,
	seedPerson,
	seedNote,
	seedReminder,
} from "#shared/tools/test-helpers"
import { cleanupInactiveLists, isStale } from "./use-cleanups"

function daysAgo(n: number): Date {
	let d = new Date()
	d.setDate(d.getDate() - n)
	return d
}

async function loadForCleanup(account: co.loaded<typeof UserAccount>) {
	return await account.$jazz.ensureLoaded({
		resolve: {
			root: {
				people: {
					$each: {
						notes: { $each: { $onError: "catch" } },
						inactiveNotes: { $each: { $onError: "catch" } },
						reminders: { $each: { $onError: "catch" } },
						inactiveReminders: { $each: { $onError: "catch" } },
						$onError: "catch",
					},
				},
				inactivePeople: {
					$each: {
						notes: { $each: { $onError: "catch" } },
						reminders: { $each: { $onError: "catch" } },
						$onError: "catch",
					},
				},
			},
		},
	})
}

async function ensureInactiveLists(person: co.loaded<typeof Person>) {
	let loaded = await person.$jazz.ensureLoaded({
		resolve: { inactiveNotes: true, inactiveReminders: true },
	})
	if (!loaded.inactiveNotes) {
		person.$jazz.set(
			"inactiveNotes",
			co.list(Note).create([], person.$jazz.owner),
		)
	}
	if (!loaded.inactiveReminders) {
		person.$jazz.set(
			"inactiveReminders",
			co.list(Reminder).create([], person.$jazz.owner),
		)
	}
}

describe("isStale", () => {
	test("is true only for dates older than 30 days", () => {
		let table = [
			...[60, 31, 29, 0].map(
				days => `${days} days ago -> ${isStale(daysAgo(days))}`,
			),
			`now -> ${isStale(new Date())}`,
		]
		expect(table).toMatchInlineSnapshot(`
			[
			  "60 days ago -> true",
			  "31 days ago -> true",
			  "29 days ago -> false",
			  "0 days ago -> false",
			  "now -> false",
			]
		`)
	})
})

type Item = { $jazz: { id: string }; content?: string; text?: string }

describe("cleanupInactiveLists", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	async function runCleanup() {
		await cleanupInactiveLists(await loadForCleanup(owner))
	}

	test("moves soft-deleted people to inactivePeople and leaves active ones", async () => {
		await seedPerson(owner, { name: "Active" })
		let deleted = await seedPerson(owner, { name: "Ada" })
		deleted.$jazz.set("deletedAt", daysAgo(1))

		await runCleanup()

		let { root } = await owner.$jazz.ensureLoaded({
			resolve: {
				root: { people: { $each: true }, inactivePeople: { $each: true } },
			},
		})
		expect(
			`people: ${root.people.map(p => p.name)} | inactive: ${root.inactivePeople?.map(p => p.name)}`,
		).toMatchInlineSnapshot(`"people: Active | inactive: Ada"`)
	})

	test("moves deleted notes and deleted or done reminders to inactive lists", async () => {
		let person = await seedPerson(owner, { name: "Ada" })
		await ensureInactiveLists(person)
		let seeded = [
			await seedNote(person, { content: "active note" }),
			await seedNote(person, { content: "to delete", deletedAt: daysAgo(1) }),
			await seedReminder(person, {
				text: "active task",
				dueAtDate: "2025-12-01",
			}),
			await seedReminder(person, {
				text: "old task",
				dueAtDate: "2025-01-01",
				deletedAt: daysAgo(1),
			}),
			await seedReminder(person, {
				text: "done task",
				dueAtDate: "2025-01-01",
				done: true,
			}),
		]
		let seededIds = new Set(seeded.map(item => item.$jazz.id))

		await runCleanup()

		let after = await person.$jazz.ensureLoaded({
			resolve: {
				notes: { $each: true },
				inactiveNotes: { $each: true },
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		})
		// A copy would lose the original's id and the links pointing to it.
		let describeItems = (items: readonly Item[] | undefined) =>
			items
				?.map(
					i =>
						`${i.content ?? i.text}${seededIds.has(i.$jazz.id) ? "" : " (copy)"}`,
				)
				.join(", ")
		expect([
			`notes: ${describeItems(after.notes)}`,
			`inactiveNotes: ${describeItems(after.inactiveNotes)}`,
			`reminders: ${describeItems(after.reminders)}`,
			`inactiveReminders: ${describeItems(after.inactiveReminders)}`,
		]).toMatchInlineSnapshot(`
			[
			  "notes: active note",
			  "inactiveNotes: to delete",
			  "reminders: active task",
			  "inactiveReminders: done task, old task",
			]
		`)
	})
})
