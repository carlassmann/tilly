import {
	createContext,
	use,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react"
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	type AnyRouter,
} from "@tanstack/react-router"
import { JazzTestProvider } from "jazz-tools/react/testing"
import { z } from "zod"
import { Navigation } from "#app/components/navigation"
import { SwipePreview } from "#app/components/swipeable-list-item"
import { PlusAccess } from "#app/hooks/use-plus-access"
import { PeopleScreen } from "#app/features/people/screens/people-screen"
import { PersonScreen } from "#app/features/people/screens/person-screen"
import { NotesScreen } from "#app/features/notes/screens/notes-screen"
import { RemindersScreen } from "#app/features/reminders/screens/reminders-screen"
import { UserMessage } from "#app/features/assistant/parts/user-message"
import { AssistantLayout } from "#app/features/assistant/parts/assistant-layout"
import { AssistantMessage } from "#app/features/assistant/widgets/assistant-message"
import { ChatInput } from "#app/features/assistant/parts/chat-input"
import { IntlProvider } from "#shared/intl/setup"
import { messagesDe } from "#shared/intl/messages"
import { Toaster } from "#shared/ui/sonner"
import type { TillyUIMessage } from "#shared/tools/tools"
import { cn } from "#app/lib/utils"
import { createDemoWorld, showFrame, type DemoWorld } from "./demo-account"
import {
	demoFrameAt,
	demoSceneIds,
	demoStory,
	type DemoSceneId,
	type DemoChatEntry,
	type DemoFrame,
	type DemoLocale,
	type DemoScreen,
} from "./demo-script"
import {
	forwardWheel,
	parseStageMessage,
	phoneMessage,
	type PhoneMessage,
	type StageMessage,
} from "./demo-phone-protocol"
import { typeInto, useScriptedDialog } from "./scripted-dialog"

export { DemoPhoneApp }

// The phone inside the landing page demo. It runs in a phone-sized frame so
// the app's mobile layout applies, and renders Tilly's own screens on an
// in-memory account. The landing page's scroll plays the story; visitors can
// take over and use the app until the story moves to its next scene.
function DemoPhoneApp() {
	let position = useStagePosition()
	let locale: DemoLocale = position?.locale ?? pageLocale()
	let sceneIndex = position?.sceneIndex ?? 0
	let world = useDemoWorld(locale)
	useDocumentLanguage(locale)
	useReadyAnnouncement(world !== null, position !== null)
	let [router] = useState(createDemoRouter)
	let isVisitorDriving = useVisitorTakeover(demoSceneIds[sceneIndex])
	let [visitorChat, setVisitorChat] = useState<TillyUIMessage[]>([])
	useWheelForwarding()

	if (!world) return null

	let frame = demoFrameAt(locale, sceneIndex, position?.progress ?? 0)

	let app = (
		<JazzTestProvider account={world.account}>
			<PlusAccess value={demoPlusAccess}>
				<ShownFrame world={world} frame={frame} />
				<DemoState
					value={{
						locale,
						world,
						frame,
						visitorChat,
						sendVisitorMessage: message =>
							setVisitorChat(chat => [
								...chat,
								message,
								demoReply(locale, chat.length),
							]),
					}}
				>
					<SwipePreview value={swipePreview(world, frame)}>
						<ScriptDirector
							router={router}
							world={world}
							frame={frame}
							isVisitorDriving={isVisitorDriving}
						/>
						<RouterProvider router={router} />
					</SwipePreview>
				</DemoState>
				<Toaster position="top-center" />
			</PlusAccess>
		</JazzTestProvider>
	)

	return locale === "de" ? (
		<IntlProvider messages={messagesDe} locale="de">
			{app}
		</IntlProvider>
	) : (
		<IntlProvider>{app}</IntlProvider>
	)
}

// The demo shows everything Plus offers, including the agent.
let demoPlusAccess = { hasPlusAccess: true, isLoading: false }

// The router is created once, so its screens read the story through context.
let DemoState = createContext<{
	locale: DemoLocale
	world: DemoWorld
	frame: DemoFrame
	// What the visitor wrote in the chat themselves, after the story's chat.
	visitorChat: TillyUIMessage[]
	sendVisitorMessage: (message: TillyUIMessage) => void
} | null>(null)

function useDemoState() {
	let state = use(DemoState)
	if (!state) throw new Error("Demo screens need the demo state")
	return state
}

function swipePreview(world: DemoWorld, frame: DemoFrame) {
	if (!frame.swipe) return {}
	let reminder = world.reminders[frame.swipe.reminder]
	return { [reminder.$jazz.id]: frame.swipe.amount }
}

// -- Routes --

let rootRoute = createRootRoute({ component: DemoLayout })

let peopleRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/people",
	component: function DemoPeople() {
		let { world } = useDemoState()
		return <PeopleScreen fallback={world.peopleScreen} />
	},
})

let personRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/people/$personID",
	validateSearch: z.object({
		tab: z.enum(["notes", "reminders"]).optional().default("notes"),
	}),
	component: function DemoPerson() {
		let { personID } = personRoute.useParams()
		let { tab } = personRoute.useSearch()
		let navigate = personRoute.useNavigate()
		return (
			<PersonScreen
				personId={personID}
				fallback={null}
				tab={tab}
				onTabChange={nextTab =>
					navigate({ search: { tab: nextTab }, replace: true })
				}
			/>
		)
	},
})

let notesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/notes",
	component: function DemoNotes() {
		let { world } = useDemoState()
		return <NotesScreen fallback={world.notesScreen} />
	},
})

let remindersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/reminders",
	component: function DemoReminders() {
		let { world } = useDemoState()
		return <RemindersScreen fallback={world.remindersScreen} />
	},
})

let assistantRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/assistant",
	component: function DemoAssistant() {
		return <DemoChat />
	},
})

// Settings and the rest need a real account, so the demo leaves them out.
let elsewhereRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "$",
	component: function DemoElsewhere() {
		let { locale } = useDemoState()
		return (
			<p className="text-muted-foreground px-6 pt-40 text-center">
				{locale === "de"
					? "Das zeigt die Demo nicht. Öffne Tilly, um alles zu sehen."
					: "This part isn't in the demo. Open Tilly to see everything."}
			</p>
		)
	},
})

function createDemoRouter() {
	return createRouter({
		routeTree: rootRoute.addChildren([
			peopleRoute,
			personRoute,
			notesRoute,
			remindersRoute,
			assistantRoute,
			elsewhereRoute,
		]),
		history: createMemoryHistory({ initialEntries: ["/people"] }),
	})
}

function DemoLayout() {
	let { locale, frame } = useDemoState()
	return (
		<>
			<main>
				<div className="container mx-auto max-w-4xl px-3 py-6">
					<Outlet />
				</div>
			</main>
			<Navigation dueReminderCount={dueTodayCount(locale, frame)} />
			<DemoNotification notification={frame.notification} />
		</>
	)
}

// -- The script --

// Moves the app along with the story: the screen, the dialog and the scroll.
// While the visitor uses the app, it waits for the next scene.
function ScriptDirector({
	router,
	world,
	frame,
	isVisitorDriving,
}: {
	router: AnyRouter
	world: DemoWorld
	frame: DemoFrame
	isVisitorDriving: boolean
}) {
	let { pathname, tab } = screenLocation(world, frame.screen)
	let isScripted = !isVisitorDriving

	useEffect(() => {
		if (!isScripted) return
		let location = router.state.location
		let search = location.search as { tab?: string }
		if (location.pathname === pathname && search.tab === tab) return
		void router.navigate({
			to: pathname,
			search: tab ? { tab } : {},
			replace: true,
		})
	}, [router, pathname, tab, isScripted])

	useScriptedDialog(frame.dialog, isScripted)
	useScriptedDraft(frame.chat.draft, isScripted)
	useScriptedScroll(frame, isScripted)
	return null
}

function screenLocation(
	world: DemoWorld,
	screen: DemoScreen,
): { pathname: string; tab?: "notes" | "reminders" } {
	if (screen.kind === "person") {
		return {
			pathname: `/people/${world.personIds[screen.friend]}`,
			tab: screen.tab,
		}
	}
	return { pathname: `/${screen.kind}` }
}

// Keeps the top of each screen in view, and the newest message in the chat.
function useScriptedScroll(frame: DemoFrame, isScripted: boolean) {
	let screenKey = JSON.stringify(frame.screen)
	let entryCount = frame.chat.entries.length
	let lastEntry = frame.chat.entries.at(-1)
	let lastLength = lastEntry && "text" in lastEntry ? lastEntry.text.length : 0
	useEffect(() => {
		if (isScripted) window.scrollTo({ top: 0 })
	}, [screenKey, isScripted])
	useEffect(() => {
		if (!isScripted || entryCount === 0) return
		window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
	}, [entryCount, lastLength, isScripted])
}

// Shows and hides the story's notes and reminders in the account before the
// screens paint.
function ShownFrame({ world, frame }: { world: DemoWorld; frame: DemoFrame }) {
	useLayoutEffect(() => showFrame(world, frame))
	return null
}

// -- The visitor --

// A tap or key press hands the app to the visitor for the rest of the scene.
// Clicks the script makes itself are not trusted events, so they don't count.
function useVisitorTakeover(sceneId: DemoSceneId): boolean {
	let [drivingScene, setDrivingScene] = useState<DemoSceneId | null>(null)
	let currentScene = useRef(sceneId)

	useEffect(() => {
		currentScene.current = sceneId
	}, [sceneId])

	useEffect(() => {
		function takeOver(event: Event) {
			if (!event.isTrusted) return
			setDrivingScene(currentScene.current)
			postToPage({ type: "visitor" })
		}
		window.addEventListener("pointerdown", takeOver, true)
		window.addEventListener("keydown", takeOver, true)
		return () => {
			window.removeEventListener("pointerdown", takeOver, true)
			window.removeEventListener("keydown", takeOver, true)
		}
	}, [])

	return drivingScene === sceneId
}

function useWheelForwarding() {
	useEffect(
		() =>
			forwardWheel(window, deltaY => postToPage({ type: "scroll", deltaY })),
		[],
	)
}

function postToPage(message: PhoneMessage) {
	window.parent.postMessage(phoneMessage(message), window.location.origin)
}

// -- The chat --

// The chat plays the story with the app's own message components, since the
// demo has no agent to talk to. Visitors can still write; the demo answers.
function DemoChat() {
	let { locale, world, frame, visitorChat, sendVisitorMessage } = useDemoState()
	let messages = [...chatMessages(world, frame.chat.entries), ...visitorChat]
	useEffect(() => {
		if (visitorChat.length === 0) return
		window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
	}, [visitorChat.length])
	return (
		<AssistantLayout>
			<div className="space-y-4">
				{messages.map(message =>
					message.role === "user" ? (
						<UserMessage key={message.id} message={message} />
					) : (
						<AssistantMessage key={message.id} message={message} />
					),
				)}
				<div className="h-56" />
				<ChatInput
					me={world.assistantScreen}
					onSubmit={sendVisitorMessage}
					chatSize={messages.length}
					placeholder={chatPlaceholder[locale]}
				/>
			</div>
		</AssistantLayout>
	)
}

let chatPlaceholder = {
	en: "Tell Tilly about someone…",
	de: "Erzähl Tilly von jemandem…",
} satisfies Record<DemoLocale, string>

function demoReply(locale: DemoLocale, index: number): TillyUIMessage {
	let text =
		locale === "de"
			? "In der Demo kenne ich nur diese Geschichte. Öffne Tilly, dann merke ich mir, was du mir erzählst."
			: "In the demo I only know this story. Open Tilly and I'll remember what you tell me."
	return {
		id: `demo-reply-${index}`,
		role: "assistant",
		parts: [{ type: "text", text }],
	}
}

// Types the story's message into the app's chat field, once it is there.
function useScriptedDraft(draft: string, isScripted: boolean) {
	useEffect(() => {
		if (!isScripted) return
		let attempts = 0
		let frame = 0
		function apply() {
			let field = document.querySelector<HTMLTextAreaElement>(
				'textarea[aria-describedby="assistant-chat-input-hint"]',
			)
			if (field) typeInto(field, draft)
			else if (draft && ++attempts < 60) frame = requestAnimationFrame(apply)
		}
		frame = requestAnimationFrame(apply)
		return () => cancelAnimationFrame(frame)
	}, [draft, isScripted])
}

// A push notification as the phone shows it, not part of the app.
function DemoNotification({
	notification,
}: {
	notification: DemoFrame["notification"]
}) {
	return (
		<div
			className={cn(
				"fixed inset-x-2 top-2 z-50 flex items-start gap-3 rounded-3xl border border-black/5 bg-white/80 p-3 text-black shadow-lg backdrop-blur-xl transition duration-500 ease-out motion-reduce:transition-none dark:border-white/10 dark:bg-neutral-800/80 dark:text-white",
				notification
					? "translate-y-0 opacity-100"
					: "pointer-events-none -translate-y-[120%] opacity-0",
			)}
			aria-hidden={!notification}
		>
			<img
				src="/app/icons/icon-192x192.png"
				alt=""
				className="size-9 rounded-lg"
			/>
			<div className="min-w-0 flex-1 text-sm leading-snug">
				<p className="font-semibold">{notification?.title}</p>
				<p>{notification?.body}</p>
			</div>
		</div>
	)
}

function chatMessages(
	world: DemoWorld,
	entries: DemoChatEntry[],
): TillyUIMessage[] {
	let messages: TillyUIMessage[] = []
	for (let [index, entry] of entries.entries()) {
		let id = `demo-${index}`
		if (entry.kind === "user") {
			messages.push({
				id,
				role: "user",
				parts: [{ type: "text", text: entry.text }],
			})
			continue
		}
		let part = assistantPart(world, entry, id)
		let previous = messages.at(-1)
		// The agent's tool calls and its answer form one message, as in the app.
		if (previous?.role === "assistant") previous.parts.push(part)
		else messages.push({ id, role: "assistant", parts: [part] })
	}
	return messages
}

function assistantPart(
	world: DemoWorld,
	entry: Exclude<DemoChatEntry, { kind: "user" }>,
	id: string,
): TillyUIMessage["parts"][number] {
	if (entry.kind === "assistant") return { type: "text", text: entry.text }
	if (entry.kind === "note") {
		return {
			type: "tool-addNote",
			toolCallId: id,
			state: "output-available",
			input: { personId: "", content: "" },
			output: world.noteOutputs[entry.note],
		}
	}
	return {
		type: "tool-addReminder",
		toolCallId: id,
		state: "output-available",
		input: { personId: "", text: "", dueAtDate: "" },
		output: world.reminderOutputs[entry.reminder],
	}
}

// The real app sets the app badge from its due reminders; the demo counts its
// own so it never touches the visitor's installed app.
function dueTodayCount(locale: DemoLocale, frame: DemoFrame): number {
	let story = demoStory(locale)
	let existing = Object.values(story.friends)
		.flatMap(friend => friend.reminders)
		.filter(reminder => reminder.dueInDays <= 0).length
	let added = Object.entries(frame.reminders).filter(
		([id, state]) =>
			state === "open" &&
			story.reminders[id as keyof typeof story.reminders].dueInDays <= 0,
	).length
	return existing + added
}

// -- The page --

function useStagePosition() {
	let [position, setPosition] = useState(positionFromUrl)
	useEffect(() => {
		function receive(event: MessageEvent) {
			if (event.origin !== window.location.origin) return
			let message = parseStageMessage(event.data)
			if (message) setPosition(message)
		}
		window.addEventListener("message", receive)
		return () => window.removeEventListener("message", receive)
	}, [])
	return position
}

function useDemoWorld(locale: DemoLocale): DemoWorld | null {
	let [world, setWorld] = useState<DemoWorld | null>(null)
	useEffect(() => {
		let cancelled = false
		void createDemoWorld(locale).then(created => {
			if (cancelled) return
			setWorld(created)
		})
		return () => {
			cancelled = true
		}
	}, [locale])
	return world
}

// The page renders the phone before its script runs, so the phone may start
// before the page listens. It says it's ready once it is, and again when the
// page first gets in touch.
function useReadyAnnouncement(isReady: boolean, hasHeardFromPage: boolean) {
	useEffect(() => {
		if (isReady) postToPage({ type: "ready" })
	}, [isReady, hasHeardFromPage])
}

// Opening the phone on its own at ?scene=talk&progress=0.8 shows that frame.
function positionFromUrl(): StageMessage | null {
	let params = new URLSearchParams(window.location.search)
	let sceneIndex = demoSceneIds.indexOf(params.get("scene") as DemoSceneId)
	if (sceneIndex === -1) return null
	return {
		locale: pageLocale(),
		sceneIndex,
		progress: Number(params.get("progress") ?? 1),
	}
}

function useDocumentLanguage(locale: DemoLocale) {
	useEffect(() => {
		document.documentElement.lang = locale
	}, [locale])
}

function pageLocale(): DemoLocale {
	return new URLSearchParams(window.location.search).get("lang") === "de"
		? "de"
		: "en"
}
