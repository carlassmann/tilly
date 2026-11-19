import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { cn } from "#app/lib/utils"
import { DemoPhone } from "./demo-phone"
import { DemoEnd, type DemoEndText } from "./demo-end"
import { demoSceneIds, type DemoLocale, type DemoSceneId } from "./demo-script"

export { TillyInAction }
export type { DemoSceneText }

interface DemoSceneText {
	id: DemoSceneId
	title: string
	body: string
}

// The phone beside the landing page's story. Scenes are elements on the page
// marked with data-demo-scene; scrolling through them plays the story.
function TillyInAction({
	locale,
	scenes,
	end,
}: {
	locale: DemoLocale
	scenes: DemoSceneText[]
	end: DemoEndText
}) {
	let position = useScrollPosition()
	let scene = scenes.find(
		candidate => candidate.id === demoSceneIds[position.sceneIndex],
	)
	let label = labels[locale]
	let isTouch = useMediaQuery("(pointer: coarse)")
	// On touch screens the phone is in use for the scene it was tapped in.
	let [activeScene, setActiveScene] = useState<number | null>(null)
	let isActive = !isTouch || activeScene === position.sceneIndex
	let [hasTried, setHasTried] = useState(false)
	let markTried = useCallback(() => setHasTried(true), [])

	return (
		<div className="flex h-full w-full flex-col items-center gap-4">
			<div className="relative min-h-0 w-full flex-1">
				<DemoPhone
					locale={locale}
					sceneIndex={position.sceneIndex}
					progress={position.progress}
					loadingLabel={label.loading}
					isInteractive={isActive}
					activateLabel={isActive ? null : label.tap}
					onActivate={() => setActiveScene(position.sceneIndex)}
					onVisitor={markTried}
				/>
			</div>
			{!isTouch && (
				<p
					className={cn(
						"text-muted-foreground text-sm transition duration-500",
						position.isAtEnd && "text-foreground text-base font-medium",
						hasTried && !position.isAtEnd && "opacity-0",
					)}
					aria-hidden={hasTried && !position.isAtEnd}
				>
					{label.hint}
				</p>
			)}
			{/* Phones have no room for the story beside the stage, so it shows
			    the current scene's text below the phone. */}
			{isTouch && isActive && (
				<div className="flex min-h-32 items-start justify-center lg:hidden">
					<button
						type="button"
						onClick={() => setActiveScene(null)}
						className="bg-foreground text-background min-h-11 rounded-full px-5 text-sm font-medium"
					>
						{label.back}
					</button>
				</div>
			)}
			{!(isTouch && isActive) && position.isAtEnd && (
				<div className="flex min-h-32 items-start justify-center lg:hidden">
					<DemoEnd text={end} isCompact />
				</div>
			)}
			{!(isTouch && isActive) && !position.isAtEnd && (
				<div
					className={cn(
						"flex min-h-32 w-full max-w-md justify-center lg:hidden",
						position.sceneIndex === 0 && "invisible",
					)}
					aria-hidden
				>
					<div
						key={scene?.id}
						className="animate-in fade-in border-primary flex flex-col gap-1 self-start border-l-2 pl-4 duration-500"
					>
						<p className="text-lg leading-snug font-bold tracking-tight text-balance sm:text-2xl">
							<span className="text-primary mr-2 text-sm font-semibold tabular-nums sm:text-base">
								{String(position.sceneIndex).padStart(2, "0")}
							</span>
							{scene?.title}
						</p>
						<p className="text-foreground/75 text-base leading-snug text-pretty sm:text-lg">
							{scene?.body}
						</p>
					</div>
				</div>
			)}
		</div>
	)
}

let labels = {
	en: {
		hint: "This is the real app. Click around.",
		tap: "Tap to try it",
		back: "Back to the tour",
		loading: "Loading the demo…",
	},
	de: {
		hint: "Das ist die echte App. Klick dich durch.",
		tap: "Zum Ausprobieren tippen",
		back: "Zurück zur Tour",
		loading: "Demo wird geladen…",
	},
} satisfies Record<DemoLocale, Record<string, string>>

function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		onChange => {
			let media = window.matchMedia(query)
			media.addEventListener("change", onChange)
			return () => media.removeEventListener("change", onChange)
		},
		() => window.matchMedia(query).matches,
		() => false,
	)
}

function useScrollPosition() {
	let [position, setPosition] = useState({
		sceneIndex: 0,
		progress: 0,
		isAtEnd: false,
	})

	useEffect(() => {
		let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
		let elements = demoSceneIds.map(id =>
			document.querySelector<HTMLElement>(`[data-demo-scene="${id}"]`),
		)
		let end = document.querySelector<HTMLElement>("[data-demo-end]")
		let frame = 0

		function measure() {
			frame = 0
			let focusLine = window.innerHeight * 0.5
			let sceneIndex = 0
			for (let [index, element] of elements.entries()) {
				if (element && element.getBoundingClientRect().top <= focusLine) {
					sceneIndex = index
				}
			}
			// The page's story text highlights the scene the phone plays.
			for (let [index, element] of elements.entries()) {
				element?.toggleAttribute("data-active", index === sceneIndex)
			}
			let scene = elements[sceneIndex]
			let progress = scene
				? (focusLine - scene.getBoundingClientRect().top) /
					Math.max(sceneLength(scene), 1)
				: 0
			setPosition({
				sceneIndex,
				isAtEnd: !!end && end.getBoundingClientRect().top <= focusLine,
				// Without motion each scene shows its end state.
				progress: reducedMotion.matches
					? 1
					: Math.max(0, Math.min(progress, 1)),
			})
		}

		function schedule() {
			if (!frame) frame = requestAnimationFrame(measure)
		}

		measure()
		window.addEventListener("scroll", schedule, { passive: true })
		window.addEventListener("resize", schedule)
		reducedMotion.addEventListener("change", schedule)
		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener("scroll", schedule)
			window.removeEventListener("resize", schedule)
			reducedMotion.removeEventListener("change", schedule)
		}
	}, [])

	return position
}

// A scene lasts for its text plus the margin below it.
function sceneLength(scene: HTMLElement): number {
	return scene.offsetHeight + parseFloat(getComputedStyle(scene).marginBottom)
}
