import {
	PUBLIC_SYNTWIN_ENABLED,
	PUBLIC_SYNTWIN_ROOM_ID,
} from "astro:env/client"
import { Button } from "#shared/ui/button"

export { DemoEnd }
export type { DemoEndText }

interface DemoEndText {
	title: string
	body: string
	// Touch screens tap the phone before they can use it.
	touchBody: string
	app: { text: string; href: string }
	syntwin: string
}

let hasSyntwin = Boolean(PUBLIC_SYNTWIN_ENABLED && PUBLIC_SYNTWIN_ROOM_ID)

// What visitors can do once the story is told: keep using the phone, start
// the app, or ask Carl's Syntwin.
function DemoEnd({
	text,
	isCompact = false,
}: {
	text: DemoEndText
	isCompact?: boolean
}) {
	if (isCompact) {
		return (
			<div className="animate-in fade-in flex flex-col items-center gap-3 text-center duration-500">
				<p className="max-w-sm">
					<span className="font-semibold">{text.title}</span>{" "}
					<span className="text-muted-foreground">{text.touchBody}</span>
				</p>
				<div className="flex flex-wrap justify-center gap-2">
					<Button nativeButton={false} render={<a href={text.app.href} />}>
						{text.app.text}
					</Button>
					{hasSyntwin && <SyntwinButton text={text.syntwin} />}
				</div>
			</div>
		)
	}

	return (
		<div className="border-primary flex flex-col gap-6 border-l-2 pl-6">
			<h3 className="text-[clamp(2rem,3vw,3rem)] leading-tight font-bold tracking-tight text-balance">
				{text.title}
			</h3>
			<p className="text-muted-foreground max-w-[40ch] text-xl leading-relaxed text-pretty">
				{text.body}
			</p>
			<div className="flex flex-wrap gap-3" data-syntwin-avoid="0px">
				<Button
					size="lg"
					className="h-12 px-6 text-base pointer-fine:h-12"
					nativeButton={false}
					render={<a href={text.app.href} />}
				>
					{text.app.text}
				</Button>
				{hasSyntwin && <SyntwinButton text={text.syntwin} isLarge />}
			</div>
		</div>
	)
}

function SyntwinButton({
	text,
	isLarge = false,
}: {
	text: string
	isLarge?: boolean
}) {
	return (
		<Button
			type="button"
			variant="outline"
			size={isLarge ? "lg" : "default"}
			className={
				isLarge ? "h-12 gap-3 pr-6 pl-2 text-base pointer-fine:h-12" : "pl-1.5"
			}
			data-syntwin-open
		>
			<img
				src="/images/avatars/carl.webp"
				alt=""
				className={isLarge ? "size-8 rounded-full" : "size-6 rounded-full"}
			/>
			{text}
		</Button>
	)
}
