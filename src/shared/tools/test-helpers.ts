import { Group, co } from "jazz-tools"
import { createJazzTestAccount } from "jazz-tools/testing"
import { Note, Person, Reminder, UserAccount } from "#shared/schema/user"

export {
	createAccount,
	seedPerson,
	seedNote,
	seedReminder,
	redactNoise,
	requireLoaded,
}

async function createAccount(opts: { isCurrentActive?: boolean } = {}) {
	return await createJazzTestAccount({
		isCurrentActiveAccount: opts.isCurrentActive ?? false,
		AccountSchema: UserAccount,
	})
}

async function seedPerson(
	account: co.loaded<typeof UserAccount>,
	args: {
		name: string
		summary?: string
		sharedWith?: co.loaded<typeof UserAccount>
	},
) {
	let { root } = await account.$jazz.ensureLoaded({
		resolve: { root: { people: true } },
	})

	let group = Group.create()
	if (args.sharedWith) {
		group.addMember(args.sharedWith, "writer")
	}

	let now = new Date()
	let person = Person.create(
		{
			version: 1,
			name: args.name,
			summary: args.summary,
			notes: co.list(Note).create([], group),
			reminders: co.list(Reminder).create([], group),
			createdAt: now,
			updatedAt: now,
		},
		group,
	)
	root.people.$jazz.push(person)
	return person
}

async function seedNote(
	person: co.loaded<typeof Person>,
	args: {
		content: string
		pinned?: boolean
		title?: string
		deletedAt?: Date
		createdAt?: Date
	},
) {
	let loaded = await person.$jazz.ensureLoaded({ resolve: { notes: true } })
	let now = new Date()
	let note = Note.create(
		{
			version: 1,
			title: args.title,
			content: args.content,
			pinned: args.pinned ?? false,
			deletedAt: args.deletedAt,
			createdAt: args.createdAt ?? now,
			updatedAt: now,
		},
		loaded.$jazz.owner,
	)
	loaded.notes.$jazz.push(note)
	return note
}

async function seedReminder(
	person: co.loaded<typeof Person>,
	args: {
		text: string
		dueAtDate: string
		done?: boolean
		deletedAt?: Date
		repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
		createdAt?: Date
		updatedAt?: Date
	},
) {
	let loaded = await person.$jazz.ensureLoaded({
		resolve: { reminders: true },
	})
	let now = new Date()
	let reminder = Reminder.create(
		{
			version: 1,
			text: args.text,
			dueAtDate: args.dueAtDate,
			done: args.done ?? false,
			repeat: args.repeat,
			deletedAt: args.deletedAt,
			createdAt: args.createdAt ?? now,
			updatedAt: args.updatedAt ?? now,
		},
		loaded.$jazz.owner,
	)
	loaded.reminders.$jazz.push(reminder)
	return reminder
}

// A failed load is broken test setup, not an output worth snapshotting.
function requireLoaded<T extends { $isLoaded: boolean }>(
	value: T | null | undefined,
	what: string,
) {
	if (!value?.$isLoaded) throw new Error(`${what} not loaded`)
	return value as Exclude<T, { $isLoaded: false }>
}

// Expect tests snapshot whole outputs; ids and timestamps differ every run.
// Ids get aliases by first appearance so relationships between them stay visible.
function redactNoise(value: unknown) {
	let aliases = new Map<string, string>()
	function redactString(text: string) {
		if (isoTimestamp.test(text)) return "<time>"
		if (!jazzId.test(text)) return text
		if (!aliases.has(text)) aliases.set(text, `<id:${aliases.size + 1}>`)
		return aliases.get(text)
	}
	return JSON.parse(JSON.stringify(value), (_key, item) =>
		typeof item === "string" ? redactString(item) : item,
	)
}

let jazzId = /^co_z\w+$/
let isoTimestamp = /^\d{4}-\d\d-\d\dT[\d:.]+Z$/
