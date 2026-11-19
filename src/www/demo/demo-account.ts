import { Group, co } from "jazz-tools"
import { createJazzTestAccount } from "jazz-tools/testing"
import { createImage } from "jazz-tools/media"
import { addDays, format, subDays } from "date-fns"
import { Note, Person, Reminder, UserAccount } from "#shared/schema/user"
import { createNote } from "#shared/tools/note-create"
import { createReminder } from "#shared/tools/reminder-create"
import { preloadPeopleWithPeople } from "#app/features/people/lib/data"
import { preloadRemindersWithPeople } from "#app/features/reminders/lib/data"
import { preloadNotesWithPeople } from "#app/features/notes/lib/data"
import { preloadAssistant } from "#app/features/assistant/lib/data"
import type { InferToolOutput } from "ai"
import type { createAddNoteTool } from "#shared/tools/note-create"
import type { createAddReminderTool } from "#shared/tools/reminder-create"
import type {
	DemoFrame,
	DemoFriendId,
	DemoLocale,
	DemoNoteId,
	DemoReminderId,
} from "./demo-script"
import { demoStory } from "./demo-script"

export { createDemoWorld, showFrame }
export type { DemoWorld }

type NoteOutput = InferToolOutput<ReturnType<typeof createAddNoteTool>>
type ReminderOutput = InferToolOutput<ReturnType<typeof createAddReminderTool>>

interface DemoWorld {
	account: co.loaded<typeof UserAccount>
	// The screens start from what their routes would preload.
	peopleScreen: Awaited<ReturnType<typeof preloadPeopleWithPeople>>
	remindersScreen: Awaited<ReturnType<typeof preloadRemindersWithPeople>>
	notesScreen: Awaited<ReturnType<typeof preloadNotesWithPeople>>
	assistantScreen: Awaited<ReturnType<typeof preloadAssistant>>
	personIds: Record<DemoFriendId, string>
	notes: Record<DemoNoteId, co.loaded<typeof Note>>
	reminders: Record<DemoReminderId, co.loaded<typeof Reminder>>
	// What the agent's tools returned, for the chat's tool cards.
	noteOutputs: Record<DemoNoteId, NoteOutput>
	reminderOutputs: Record<DemoReminderId, ReminderOutput>
	scripted: ReturnType<typeof scriptedValues>
}

// The website has no account. The demo runs a throwaway account that lives
// only in memory: no storage, no sync, gone on reload. Jazz's test account is
// exactly that, so the demo uses it instead of the app's persisted setup.
async function createDemoWorld(locale: DemoLocale): Promise<DemoWorld> {
	let story = demoStory(locale)
	let account = await createJazzTestAccount({
		AccountSchema: UserAccount,
		isCurrentActiveAccount: true,
		creationProps: { name: "Carl" },
	})
	let loaded = await account.$jazz.ensureLoaded({
		resolve: { root: { people: true } },
	})
	loaded.root.$jazz.set("language", locale)

	let personIds = {} as Record<DemoFriendId, string>
	let friendIds = Object.keys(story.friends) as DemoFriendId[]
	for (let friendId of friendIds) {
		let friend = story.friends[friendId]
		let group = Group.create()
		let updatedAt = subDays(new Date(), friend.updatedDaysAgo)
		let person = Person.create(
			{
				version: 1,
				name: friend.name,
				summary: friend.summary,
				notes: co.list(Note).create(
					friend.notes.map(note =>
						Note.create(
							{
								version: 1,
								content: note.text,
								pinned: note.pinned,
								createdAt: subDays(new Date(), note.daysAgo),
								updatedAt: subDays(new Date(), note.daysAgo),
							},
							group,
						),
					),
					group,
				),
				reminders: co.list(Reminder).create(
					friend.reminders.map(reminder =>
						Reminder.create(
							{
								version: 1,
								text: reminder.text,
								dueAtDate: dateString(reminder.dueInDays),
								done: false,
								createdAt: updatedAt,
								updatedAt,
							},
							group,
						),
					),
					group,
				),
				createdAt: subDays(new Date(), 90),
				updatedAt,
			},
			group,
		)
		let photo = await avatarImage(friendId)
		if (photo) {
			let avatar = await createImage(photo, { owner: group, maxSize: 256 })
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same cast as the person tools
			person.$jazz.set("avatar", avatar as any)
		}
		loaded.root.people.$jazz.push(person)
		personIds[friendId] = person.$jazz.id
	}

	// The agent's edits go through the same tools Tilly's agent calls.
	let noteOutputs = {} as Record<DemoNoteId, NoteOutput>
	let noteIds = Object.keys(story.notes) as DemoNoteId[]
	for (let noteId of noteIds) {
		let note = story.notes[noteId]
		noteOutputs[noteId] = await createNote(account, {
			personId: personIds[note.friend],
			content: note.text,
		})
	}
	let reminderOutputs = {} as Record<DemoReminderId, ReminderOutput>
	let reminderIds = Object.keys(story.reminders) as DemoReminderId[]
	for (let reminderId of reminderIds) {
		let reminder = story.reminders[reminderId]
		reminderOutputs[reminderId] = await createReminder(account, {
			personId: personIds[reminder.friend],
			text: reminder.text,
			dueAtDate: dateString(reminder.dueInDays),
		})
	}

	// Edits bump a person's updatedAt; the list keeps the story's order.
	for (let friendId of friendIds) {
		let person = await Person.load(personIds[friendId])
		if (!person.$isLoaded) continue
		person.$jazz.set(
			"updatedAt",
			subDays(new Date(), story.friends[friendId].updatedDaysAgo),
		)
	}

	let notes = {} as DemoWorld["notes"]
	for (let noteId of noteIds) {
		let note = await Note.load(currentOf(noteOutputs[noteId]).noteId)
		if (!note.$isLoaded) throw new Error(`Demo note ${noteId} did not load`)
		notes[noteId] = note
	}
	let reminders = {} as DemoWorld["reminders"]
	for (let reminderId of reminderIds) {
		let reminder = await Reminder.load(
			currentOf(reminderOutputs[reminderId]).reminderId,
		)
		if (!reminder.$isLoaded) {
			throw new Error(`Demo reminder ${reminderId} did not load`)
		}
		reminders[reminderId] = reminder
	}

	return {
		account: loaded,
		peopleScreen: await preloadPeopleWithPeople(account.$jazz.id),
		remindersScreen: await preloadRemindersWithPeople(account.$jazz.id),
		notesScreen: await preloadNotesWithPeople(account.$jazz.id),
		assistantScreen: await preloadAssistant(account.$jazz.id),
		personIds,
		notes,
		reminders,
		noteOutputs,
		reminderOutputs,
		scripted: scriptedValues(),
	}
}

// Story notes and reminders exist from the start; ones the visitor hasn't
// scrolled to yet are deleted, so the app's own lists leave them out. Each is
// only written when the script changes it, so what visitors do to them stays.
function showFrame(world: DemoWorld, frame: DemoFrame) {
	for (let [id, note] of Object.entries(world.notes)) {
		let content = frame.notes[id as DemoNoteId]
		if (!world.scripted.changes(`note:${id}`, content)) continue
		if (content === null) {
			if (!note.deletedAt) note.$jazz.set("deletedAt", new Date())
			continue
		}
		if (note.deletedAt) note.$jazz.delete("deletedAt")
		if (note.content !== content) note.$jazz.set("content", content)
	}
	for (let [id, reminder] of Object.entries(world.reminders)) {
		let state = frame.reminders[id as DemoReminderId]
		if (!world.scripted.changes(`reminder:${id}`, state)) continue
		let shown = state !== "hidden"
		if (shown && reminder.deletedAt) reminder.$jazz.delete("deletedAt")
		if (!shown && !reminder.deletedAt) {
			reminder.$jazz.set("deletedAt", new Date())
		}
		let done = state === "done"
		if (reminder.done !== done) reminder.$jazz.set("done", done)
	}
}

// Remembers what the script last set for each item.
function scriptedValues() {
	let last = new Map<string, unknown>()
	return {
		changes(key: string, value: unknown): boolean {
			if (last.has(key) && last.get(key) === value) return false
			last.set(key, value)
			return true
		},
	}
}

// A photo that doesn't load leaves the friend with initials rather than
// keeping the whole demo from starting.
async function avatarImage(friendId: DemoFriendId): Promise<Blob | null> {
	try {
		let response = await fetch(`/images/demo/${friendId}.webp`)
		return response.ok ? await response.blob() : null
	} catch {
		return null
	}
}

function currentOf<T extends { current: unknown }>(
	output: T | { error: string },
): T["current"] {
	if ("error" in output) throw new Error(output.error)
	return output.current
}

function dateString(daysFromToday: number): string {
	return format(addDays(new Date(), daysFromToday), "yyyy-MM-dd")
}
