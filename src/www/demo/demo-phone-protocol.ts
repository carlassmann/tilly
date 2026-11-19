import { z } from "zod"

export {
	stageMessage,
	parseStageMessage,
	phoneMessage,
	parsePhoneMessage,
	forwardWheel,
}
export type { StageMessage, PhoneMessage }

let source = "tilly-demo-phone"

// Where the landing page's scroll is; the phone works out the rest itself.
let stageMessageSchema = z.object({
	source: z.literal(source),
	locale: z.enum(["en", "de"]),
	sceneIndex: z.number(),
	progress: z.number(),
})

type StageMessage = Omit<z.infer<typeof stageMessageSchema>, "source">

function stageMessage(message: StageMessage) {
	return { source, ...message }
}

function parseStageMessage(data: unknown): StageMessage | null {
	let parsed = stageMessageSchema.safeParse(data)
	return parsed.success ? parsed.data : null
}

// What the phone tells the page: it has started, the visitor took over, or
// the wheel turned over it and should scroll the page.
let phoneMessageSchema = z.discriminatedUnion("type", [
	z.object({ source: z.literal(source), type: z.literal("ready") }),
	z.object({ source: z.literal(source), type: z.literal("visitor") }),
	z.object({
		source: z.literal(source),
		type: z.literal("scroll"),
		deltaY: z.number(),
	}),
])

type PhoneMessage =
	| { type: "ready" }
	| { type: "visitor" }
	| { type: "scroll"; deltaY: number }

function phoneMessage(message: PhoneMessage) {
	return { source, ...message }
}

function parsePhoneMessage(data: unknown): PhoneMessage | null {
	let parsed = phoneMessageSchema.safeParse(data)
	return parsed.success ? parsed.data : null
}

// The page's scroll drives the story, so the wheel over the phone scrolls the
// page rather than the app.
function forwardWheel(target: EventTarget, scroll: (deltaY: number) => void) {
	function handleWheel(event: Event) {
		if (!(event instanceof WheelEvent)) return
		if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
		event.preventDefault()
		scroll(
			event.deltaMode === WheelEvent.DOM_DELTA_LINE
				? event.deltaY * 16
				: event.deltaY,
		)
	}
	target.addEventListener("wheel", handleWheel, { passive: false })
	return () => target.removeEventListener("wheel", handleWheel)
}
