import { expect, test } from "vitest"
import type { DemoFrame, DemoSceneId } from "./demo-script"
import { demoFrameAt, demoSceneIds, demoStory, typedText } from "./demo-script"

function frameAt(sceneId: DemoSceneId, progress: number) {
	return demoFrameAt("en", demoSceneIds.indexOf(sceneId), progress)
}

function summarize(frame: DemoFrame) {
	let addedNotes = Object.entries(frame.notes).filter(([, text]) => text)
	let swipe = frame.swipe
		? `${frame.swipe.reminder} ${frame.swipe.amount > 0.5 ? "past" : "under"} half`
		: "-"
	return [
		`screen ${frame.screen.kind}`,
		`notes [${addedNotes.map(([id]) => id).join(", ")}]`,
		`follow-up ${frame.reminders.sarahFollowUp}`,
		`dialog ${frame.dialog?.kind ?? "-"}`,
		`swipe ${swipe}`,
		`notification ${frame.notification ? "shown" : "-"}`,
		`chat ${frame.chat.entries.length}`,
	].join(" · ")
}

test("demoFrameAt walks through the scenes, keeping what earlier scenes added", () => {
	let moments: [DemoSceneId, number][] = [
		["intro", 0],
		["log", 0.4],
		["log", 0.9],
		["remind", 0.3],
		["remind", 1],
		["talk", 0],
		["today", 0.7],
		["today", 1],
	]
	let table = moments.map(
		([sceneId, progress]) =>
			`${sceneId} @ ${progress}: ${summarize(frameAt(sceneId, progress))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "intro @ 0: screen people · notes [] · follow-up hidden · dialog - · swipe - · notification - · chat 0",
		  "log @ 0.4: screen person · notes [] · follow-up hidden · dialog note · swipe - · notification - · chat 0",
		  "log @ 0.9: screen person · notes [sarahInterview] · follow-up hidden · dialog - · swipe - · notification - · chat 0",
		  "remind @ 0.3: screen person · notes [sarahInterview] · follow-up hidden · dialog reminder · swipe - · notification - · chat 0",
		  "remind @ 1: screen person · notes [sarahInterview] · follow-up open · dialog - · swipe - · notification shown · chat 0",
		  "talk @ 0: screen assistant · notes [sarahInterview] · follow-up open · dialog - · swipe - · notification - · chat 0",
		  "today @ 0.7: screen reminders · notes [sarahInterview, sophieClient, maxMove] · follow-up open · dialog - · swipe sarahFollowUp past half · notification - · chat 7",
		  "today @ 1: screen reminders · notes [sarahInterview, sophieClient, maxMove] · follow-up done · dialog - · swipe - · notification - · chat 7",
		]
	`)
})

test("demoFrameAt types the note into the dialog before saving its full text", () => {
	let text = demoStory("en").notes.sarahInterview.text
	expect(text.startsWith(frameAt("log", 0.4).dialog?.text ?? "x")).toBe(true)
	expect(frameAt("log", 0.9).notes.sarahInterview).toBe(text)
})

test("demoFrameAt puts the agent's answer after its tool calls", () => {
	let talk = demoSceneIds.indexOf("talk")
	let kinds = demoFrameAt("de", talk, 1).chat.entries.map(entry => entry.kind)
	expect(kinds).toEqual(["user", "note", "note", "reminder", "assistant"])
})

test("typedText types whole words", () => {
	expect(typedText("Moving to Berlin", 0)).toBe("")
	expect(typedText("Moving to Berlin", 0.3)).toBe("Moving")
	expect(typedText("Moving to Berlin", 1)).toBe("Moving to Berlin")
})
