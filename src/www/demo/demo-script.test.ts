import { describe, expect, test } from "vitest"
import { demoFrameAt, demoSceneIds, demoStory, typedText } from "./demo-script"

describe("demoFrameAt", () => {
	test("starts on the people list with nothing added", () => {
		let frame = demoFrameAt("en", 0, 0)
		expect(frame.screen).toEqual({ kind: "people" })
		expect(Object.values(frame.notes)).toEqual([null, null, null])
		expect(frame.chat.entries).toEqual([])
	})

	test("keeps what earlier scenes added", () => {
		let talk = demoSceneIds.indexOf("talk")
		let frame = demoFrameAt("en", talk, 0)
		expect(frame.notes.sarahInterview).toBe(
			demoStory("en").notes.sarahInterview.text,
		)
		expect(frame.reminders.sarahFollowUp).toBe("open")
		expect(frame.notes.maxMove).toBeNull()
	})

	test("shows the notification only in its own scene", () => {
		let remind = demoSceneIds.indexOf("remind")
		expect(demoFrameAt("en", remind, 1).notification).not.toBeNull()
		expect(demoFrameAt("en", remind + 1, 0).notification).toBeNull()
	})

	test("types a note into the dialog, then saves it", () => {
		let log = demoSceneIds.indexOf("log")
		let text = demoStory("en").notes.sarahInterview.text
		let typing = demoFrameAt("en", log, 0.4)
		expect(typing.dialog?.kind).toBe("note")
		expect(text.startsWith(typing.dialog?.text ?? "x")).toBe(true)
		expect(typing.notes.sarahInterview).toBeNull()
		let saved = demoFrameAt("en", log, 0.9)
		expect(saved.dialog).toBeNull()
		expect(saved.notes.sarahInterview).toBe(text)
	})

	test("swipes the follow-up away and leaves it done", () => {
		let today = demoSceneIds.indexOf("today")
		let swiping = demoFrameAt("en", today, 0.7)
		expect(swiping.swipe?.reminder).toBe("sarahFollowUp")
		expect(swiping.swipe?.amount).toBeGreaterThan(0.5)
		expect(swiping.reminders.sarahFollowUp).toBe("open")
		let done = demoFrameAt("en", today, 1)
		expect(done.swipe).toBeNull()
		expect(done.reminders.sarahFollowUp).toBe("done")
	})

	test("closes dialogs when the next scene starts", () => {
		let remind = demoSceneIds.indexOf("remind")
		expect(demoFrameAt("en", remind, 0.3).dialog?.kind).toBe("reminder")
		expect(demoFrameAt("en", remind + 1, 0).dialog).toBeNull()
	})

	test("the agent's answer follows its tool calls in the chat", () => {
		let talk = demoSceneIds.indexOf("talk")
		let kinds = demoFrameAt("de", talk, 1).chat.entries.map(entry => entry.kind)
		expect(kinds).toEqual(["user", "note", "note", "reminder", "assistant"])
	})
})

describe("typedText", () => {
	test("types whole words", () => {
		expect(typedText("Moving to Berlin", 0)).toBe("")
		expect(typedText("Moving to Berlin", 0.3)).toBe("Moving")
		expect(typedText("Moving to Berlin", 1)).toBe("Moving to Berlin")
	})
})
