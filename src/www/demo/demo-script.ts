export { demoSceneIds, demoFrameAt, demoStory, typedText }
export type {
	DemoLocale,
	DemoSceneId,
	DemoScreen,
	DemoFrame,
	DemoChatEntry,
	DemoDialog,
	DemoReminderState,
	DemoStory,
	DemoFriend,
	DemoFriendId,
	DemoNoteId,
	DemoReminderId,
}

let demoSceneIds = [
	"intro",
	"log",
	"remind",
	"talk",
	"catchup",
	"today",
] as const

type DemoSceneId = (typeof demoSceneIds)[number]
type DemoLocale = "en" | "de"
type DemoFriendId = "sarah" | "sophie" | "max" | "lena" | "jonas"
// Notes and reminders the story adds while the visitor scrolls.
type DemoNoteId = "sarahInterview" | "sophieClient" | "maxMove"
type DemoReminderId = "sarahFollowUp" | "maxMove"

type DemoScreen =
	| { kind: "people" }
	| { kind: "person"; friend: DemoFriendId; tab: "notes" | "reminders" }
	| { kind: "reminders" }
	| { kind: "assistant" }

type DemoChatEntry =
	| { kind: "user"; text: string }
	| { kind: "note"; note: DemoNoteId }
	| { kind: "reminder"; reminder: DemoReminderId }
	| { kind: "assistant"; text: string }

// A dialog the script opens and fills in, as a visitor would.
type DemoDialog = { kind: "note" | "reminder"; text: string }

type DemoReminderState = "hidden" | "open" | "done"

interface DemoFrame {
	sceneId: DemoSceneId
	screen: DemoScreen
	// Text typed so far for each added note, or null while it doesn't exist yet.
	notes: Record<DemoNoteId, string | null>
	reminders: Record<DemoReminderId, DemoReminderState>
	dialog: DemoDialog | null
	// A reminder row dragged sideways, as a share of its width. Past half
	// the width, letting go marks it done.
	swipe: { reminder: DemoReminderId; amount: number } | null
	chat: { draft: string; entries: DemoChatEntry[] }
	notification: { title: string; body: string } | null
}

interface DemoFriend {
	name: string
	summary: string
	// Days since we last added something, so the list has a stable order.
	updatedDaysAgo: number
	notes: { text: string; daysAgo: number; pinned?: boolean }[]
	reminders: { text: string; dueInDays: number }[]
}

interface DemoStory {
	friends: Record<DemoFriendId, DemoFriend>
	notes: Record<DemoNoteId, { friend: DemoFriendId; text: string }>
	reminders: Record<
		DemoReminderId,
		{ friend: DemoFriendId; text: string; dueInDays: number }
	>
	chat: {
		dinner: string
		dinnerReply: string
		catchUp: string
		catchUpReply: string
	}
	notification: { title: string; body: string }
}

let stories: Record<DemoLocale, DemoStory> = {
	en: {
		friends: {
			sarah: {
				name: "Sarah",
				summary:
					"Designer, loves bouldering. Thinking about a new job #climbing",
				updatedDaysAgo: 3,
				notes: [
					{ text: "Started bouldering twice a week with Tom.", daysAgo: 12 },
					{
						text: "Birthday on **May 14**. Loves anything with lemons.",
						daysAgo: 60,
						pinned: true,
					},
				],
				reminders: [],
			},
			sophie: {
				name: "Sophie",
				summary: "Runs her own design studio. Two kids, Mila and Ben #studio",
				updatedDaysAgo: 5,
				notes: [{ text: "Mila started school this autumn.", daysAgo: 20 }],
				reminders: [
					{ text: "Send Sophie the podcast about pricing", dueInDays: 2 },
				],
			},
			max: {
				name: "Max",
				summary: "Old friend from university. Cooks the best ramen #food",
				updatedDaysAgo: 9,
				notes: [{ text: "Wants to visit Japan next spring.", daysAgo: 30 }],
				reminders: [],
			},
			lena: {
				name: "Lena",
				summary: "Sister. Training for her first half marathon #family",
				updatedDaysAgo: 1,
				notes: [
					{
						text: "Half marathon on October 12, goal is under 2 hours.",
						daysAgo: 4,
					},
				],
				reminders: [{ text: "Wish Lena good luck for the race", dueInDays: 0 }],
			},
			jonas: {
				name: "Jonas",
				summary: "Neighbor. Lends us his drill, plays the cello #neighbors",
				updatedDaysAgo: 21,
				notes: [],
				reminders: [],
			},
		},
		notes: {
			sarahInterview: {
				friend: "sarah",
				text: "Has a job interview at a design agency on Thursday. A bit nervous about the portfolio part.",
			},
			sophieClient: {
				friend: "sophie",
				text: "Landed a big new client for the studio. Seemed much more relaxed.",
			},
			maxMove: {
				friend: "max",
				text: "Moving to Berlin in March for a new job.",
			},
		},
		reminders: {
			sarahFollowUp: {
				friend: "sarah",
				text: "Ask Sarah how the interview went",
				dueInDays: 0,
			},
			maxMove: {
				friend: "max",
				text: "Offer Max help with the move",
				dueInDays: 30,
			},
		},
		chat: {
			dinner:
				"Dinner with Sophie and Max. Sophie landed a big new client, Max is moving to Berlin in March.",
			dinnerReply:
				"Noted for both. I also set a reminder to offer Max help with the move.",
			catchUp: "Catch me up on Max before I call him",
			catchUpReply:
				"**Max** is moving to Berlin in March for a new job. He wants to visit Japan next spring and still cooks the best ramen.\n\nYou could ask:\n- How the flat hunt in Berlin is going\n- Whether Japan is still on for spring",
		},
		notification: {
			title: "Tilly",
			body: "Ask Sarah how the interview went",
		},
	},
	de: {
		friends: {
			sarah: {
				name: "Sarah",
				summary:
					"Designerin, liebt Bouldern. Denkt über einen neuen Job nach #klettern",
				updatedDaysAgo: 3,
				notes: [
					{
						text: "Geht jetzt zweimal die Woche mit Tom bouldern.",
						daysAgo: 12,
					},
					{
						text: "Geburtstag am **14. Mai**. Liebt alles mit Zitrone.",
						daysAgo: 60,
						pinned: true,
					},
				],
				reminders: [],
			},
			sophie: {
				name: "Sophie",
				summary:
					"Hat ihr eigenes Designstudio. Zwei Kinder, Mila und Ben #studio",
				updatedDaysAgo: 5,
				notes: [
					{
						text: "Mila ist diesen Herbst in die Schule gekommen.",
						daysAgo: 20,
					},
				],
				reminders: [
					{ text: "Sophie den Podcast über Preise schicken", dueInDays: 2 },
				],
			},
			max: {
				name: "Max",
				summary: "Alter Freund aus dem Studium. Kocht den besten Ramen #essen",
				updatedDaysAgo: 9,
				notes: [{ text: "Will nächsten Frühling nach Japan.", daysAgo: 30 }],
				reminders: [],
			},
			lena: {
				name: "Lena",
				summary: "Schwester. Trainiert für ihren ersten Halbmarathon #familie",
				updatedDaysAgo: 1,
				notes: [
					{
						text: "Halbmarathon am 12. Oktober, Ziel unter 2 Stunden.",
						daysAgo: 4,
					},
				],
				reminders: [{ text: "Lena Glück für den Lauf wünschen", dueInDays: 0 }],
			},
			jonas: {
				name: "Jonas",
				summary:
					"Nachbar. Leiht uns seine Bohrmaschine, spielt Cello #nachbarn",
				updatedDaysAgo: 21,
				notes: [],
				reminders: [],
			},
		},
		notes: {
			sarahInterview: {
				friend: "sarah",
				text: "Hat Donnerstag ein Vorstellungsgespräch bei einer Designagentur. Etwas nervös wegen der Portfolio-Präsentation.",
			},
			sophieClient: {
				friend: "sophie",
				text: "Hat einen großen neuen Kunden fürs Studio gewonnen. Wirkte viel entspannter.",
			},
			maxMove: {
				friend: "max",
				text: "Zieht im März für einen neuen Job nach Berlin.",
			},
		},
		reminders: {
			sarahFollowUp: {
				friend: "sarah",
				text: "Sarah fragen, wie das Gespräch lief",
				dueInDays: 0,
			},
			maxMove: {
				friend: "max",
				text: "Max Hilfe beim Umzug anbieten",
				dueInDays: 30,
			},
		},
		chat: {
			dinner:
				"Abendessen mit Sophie und Max. Sophie hat einen großen neuen Kunden, Max zieht im März nach Berlin.",
			dinnerReply:
				"Für beide notiert. Außerdem erinnere ich dich daran, Max Hilfe beim Umzug anzubieten.",
			catchUp: "Was gibt es Neues bei Max, bevor ich ihn anrufe?",
			catchUpReply:
				"**Max** zieht im März für einen neuen Job nach Berlin. Er will nächsten Frühling nach Japan und kocht immer noch den besten Ramen.\n\nDu könntest fragen:\n- Wie die Wohnungssuche in Berlin läuft\n- Ob Japan im Frühling noch steht",
		},
		notification: {
			title: "Tilly",
			body: "Sarah fragen, wie das Gespräch lief",
		},
	},
}

function demoStory(locale: DemoLocale): DemoStory {
	return stories[locale]
}

// What the phone shows at a point of the scroll: the scene the visitor is in
// and how far through it they are (0..1). Everything earlier scenes added
// stays, so scrolling back plays the story in reverse.
function demoFrameAt(
	locale: DemoLocale,
	sceneIndex: number,
	progress: number,
): DemoFrame {
	let story = stories[locale]
	let index = Math.max(0, Math.min(sceneIndex, demoSceneIds.length - 1))
	let sceneId = demoSceneIds[index]
	let t = Math.max(0, Math.min(progress, 1))
	let frame: DemoFrame = {
		sceneId,
		screen: { kind: "people" },
		notes: { sarahInterview: null, sophieClient: null, maxMove: null },
		reminders: { sarahFollowUp: "hidden", maxMove: "hidden" },
		dialog: null,
		swipe: null,
		chat: { draft: "", entries: [] },
		notification: null,
	}
	for (let earlier of demoSceneIds.slice(0, index)) {
		scenes[earlier](frame, story, 1)
	}
	// Notifications, dialogs and swipes belong to their scene only.
	frame.notification = null
	frame.dialog = null
	frame.swipe = null
	scenes[sceneId](frame, story, t)
	return frame
}

type SceneScript = (frame: DemoFrame, story: DemoStory, t: number) => void

let scenes: Record<DemoSceneId, SceneScript> = {
	intro(frame) {
		frame.screen = { kind: "people" }
	},
	log(frame, story, t) {
		frame.screen = { kind: "person", friend: "sarah", tab: "notes" }
		let text = story.notes.sarahInterview.text
		if (t >= 0.1 && t < 0.75) {
			frame.dialog = { kind: "note", text: typedText(text, (t - 0.15) / 0.5) }
		}
		frame.notes.sarahInterview = t >= 0.75 ? text : null
	},
	remind(frame, story, t) {
		frame.screen = {
			kind: "person",
			friend: "sarah",
			tab: t < 0.08 ? "notes" : "reminders",
		}
		let text = story.reminders.sarahFollowUp.text
		if (t >= 0.15 && t < 0.55) {
			frame.dialog = {
				kind: "reminder",
				text: typedText(text, (t - 0.2) / 0.25),
			}
		}
		frame.reminders.sarahFollowUp = t >= 0.55 ? "open" : "hidden"
		frame.notification = t >= 0.65 ? story.notification : null
	},
	talk(frame, story, t) {
		frame.screen = { kind: "assistant" }
		frame.chat.draft = t < 0.4 ? typedText(story.chat.dinner, t / 0.35) : ""
		if (t < 0.4) return
		frame.chat.entries.push({ kind: "user", text: story.chat.dinner })
		if (t >= 0.5) {
			frame.notes.sophieClient = story.notes.sophieClient.text
			frame.chat.entries.push({ kind: "note", note: "sophieClient" })
		}
		if (t >= 0.6) {
			frame.notes.maxMove = story.notes.maxMove.text
			frame.chat.entries.push({ kind: "note", note: "maxMove" })
		}
		if (t >= 0.7) {
			frame.reminders.maxMove = "open"
			frame.chat.entries.push({ kind: "reminder", reminder: "maxMove" })
		}
		if (t >= 0.75) {
			frame.chat.entries.push({
				kind: "assistant",
				text: typedText(story.chat.dinnerReply, (t - 0.75) / 0.2),
			})
		}
	},
	catchup(frame, story, t) {
		frame.screen = { kind: "assistant" }
		frame.chat.draft = t < 0.35 ? typedText(story.chat.catchUp, t / 0.3) : ""
		if (t < 0.35) return
		frame.chat.entries.push({ kind: "user", text: story.chat.catchUp })
		if (t >= 0.45) {
			frame.chat.entries.push({
				kind: "assistant",
				text: typedText(story.chat.catchUpReply, (t - 0.45) / 0.45),
			})
		}
	},
	// After asking Sarah, swipe her reminder away.
	today(frame, _story, t) {
		frame.screen = { kind: "reminders" }
		if (t >= 0.25 && t < 0.8) {
			let amount =
				t < 0.55
					? 0.35 * smooth((t - 0.25) / 0.2)
					: 0.35 + 0.3 * smooth((t - 0.55) / 0.15)
			frame.swipe = { reminder: "sarahFollowUp", amount }
		}
		if (t >= 0.8) frame.reminders.sarahFollowUp = "done"
	},
}

function smooth(progress: number): number {
	let p = Math.max(0, Math.min(progress, 1))
	return p * p * (3 - 2 * p)
}

// Types whole words, so text never ends mid-word while scrolling.
function typedText(text: string, progress: number): string {
	let p = Math.max(0, Math.min(progress, 1))
	if (p >= 1) return text
	if (p <= 0) return ""
	let cut = Math.round(text.length * p)
	let wordEnd = text.indexOf(" ", cut)
	return text.slice(0, wordEnd === -1 ? text.length : wordEnd)
}
