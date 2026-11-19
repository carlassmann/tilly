import { useEffect, useRef, useState } from "react"
import { cn } from "#app/lib/utils"
import type { DemoLocale } from "./demo-script"
import { parsePhoneMessage, stageMessage } from "./demo-phone-protocol"

export { DemoPhone }

// An iPhone at its real size in CSS pixels, scaled to fit the stage.
let screenWidth = 390
let screenHeight = 844
let bezel = 12
let deviceWidth = screenWidth + bezel * 2
let deviceHeight = screenHeight + bezel * 2
let statusBarHeight = 50

function DemoPhone({
	locale,
	sceneIndex,
	progress,
	loadingLabel,
	isInteractive,
	activateLabel,
	onActivate,
	onVisitor,
}: {
	locale: DemoLocale
	sceneIndex: number
	progress: number
	// Shown over the app's first screen until the app has started.
	loadingLabel: string
	isInteractive: boolean
	// Touch screens tap the phone to use it, since it would otherwise keep
	// their swipes from scrolling the page.
	activateLabel: string | null
	onActivate: () => void
	onVisitor: () => void
}) {
	let frame = useRef<HTMLIFrameElement>(null)
	let [isReady, setIsReady] = useState(false)

	useEffect(() => {
		function receive(event: MessageEvent) {
			if (event.source !== frame.current?.contentWindow) return
			let message = parsePhoneMessage(event.data)
			if (message?.type === "ready") setIsReady(true)
			if (message?.type === "visitor") onVisitor()
			if (message?.type === "scroll") window.scrollBy({ top: message.deltaY })
		}
		window.addEventListener("message", receive)
		return () => window.removeEventListener("message", receive)
	}, [onVisitor])

	// Sent before the phone is ready too, so a phone that started before the
	// page did learns that the page now listens.
	useEffect(() => {
		frame.current?.contentWindow?.postMessage(
			stageMessage({ locale, sceneIndex, progress }),
			window.location.origin,
		)
	}, [isReady, locale, sceneIndex, progress])

	return (
		// Fills the stage absolutely: Safari resolves a percentage height in the
		// stage's flex column to 0, which left the phone at scale 0.
		// The page sets --phone-scale before its first paint; see ProductDemo.
		<div
			data-phone-slot
			data-width={deviceWidth}
			data-height={deviceHeight}
			className="absolute inset-0"
		>
			<div
				className="absolute top-1/2 left-1/2 rounded-[64px] bg-neutral-900 shadow-2xl ring-1 shadow-black/30 ring-neutral-700"
				style={{
					width: deviceWidth,
					height: deviceHeight,
					padding: bezel,
					transform: "translate(-50%, -50%) scale(var(--phone-scale, 0))",
				}}
			>
				<div className="bg-background text-foreground relative flex h-full flex-col overflow-hidden rounded-[52px]">
					<StatusBar />
					<div className="relative flex-1">
						<FirstScreen locale={locale} isHidden={isReady} />
						{!isReady && <LoadingBadge label={loadingLabel} />}
						<iframe
							ref={frame}
							src={`/demo/phone?lang=${locale}`}
							title="Tilly"
							className={cn(
								"absolute inset-0 block border-0 opacity-0 transition-opacity duration-500",
								isReady && "opacity-100",
								!isInteractive && "pointer-events-none",
							)}
							style={{
								width: screenWidth,
								height: screenHeight - statusBarHeight,
							}}
						/>
						{activateLabel && isReady && (
							<button
								type="button"
								onClick={onActivate}
								className="absolute inset-0 flex items-end justify-center pb-28"
							>
								<span className="bg-primary text-primary-foreground animate-in fade-in rounded-full px-7 py-4 text-2xl font-semibold shadow-lg">
									{activateLabel}
								</span>
							</button>
						)}
					</div>
					<span className="bg-foreground/80 pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full" />
				</div>
			</div>
		</div>
	)
}

// Screenshots of the app's first screen, so the phone looks the same before
// and after the app has started.
function FirstScreen({
	locale,
	isHidden,
}: {
	locale: DemoLocale
	isHidden: boolean
}) {
	return (
		<picture>
			<source
				media="(prefers-color-scheme: dark)"
				srcSet={`/images/demo/first-frame-${locale}-dark.webp`}
			/>
			<img
				src={`/images/demo/first-frame-${locale}-light.webp`}
				alt=""
				className={cn(
					"absolute inset-0 size-full object-cover object-top transition-opacity duration-500",
					isHidden && "opacity-0",
				)}
			/>
		</picture>
	)
}

function LoadingBadge({ label }: { label: string }) {
	return (
		<div className="absolute inset-x-0 bottom-26 flex justify-center">
			<span
				role="status"
				className="bg-background/90 text-foreground flex items-center gap-3 rounded-full px-5 py-3 text-[17px] font-medium shadow-lg ring-1 ring-black/5 backdrop-blur dark:ring-white/10"
			>
				<span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent motion-reduce:animate-none" />
				{label}
			</span>
		</div>
	)
}

function StatusBar() {
	return (
		<div
			className="relative flex shrink-0 items-center justify-between px-10 text-[17px] font-semibold"
			style={{ height: statusBarHeight }}
			aria-hidden
		>
			<span>9:41</span>
			<span className="absolute top-[11px] left-1/2 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" />
			<span className="flex items-center gap-1.5">
				<span className="flex h-3 items-end gap-0.5">
					{[5, 7, 9, 12].map(height => (
						<span
							key={height}
							className="bg-foreground w-[3px] rounded-[1px]"
							style={{ height }}
						/>
					))}
				</span>
				<span className="border-foreground/40 relative ml-1 h-[13px] w-[25px] rounded-[4px] border p-px">
					<span className="bg-foreground block h-full w-[80%] rounded-[2px]" />
				</span>
			</span>
		</div>
	)
}
