import {
	PUBLIC_SYNTWIN_ENABLED,
	PUBLIC_SYNTWIN_ROOM_ID,
} from "astro:env/client"
import { ArrowRight } from "react-bootstrap-icons"

export { SyntwinCTA }

interface SyntwinCTAProps {
	title: string
	description: string
	creator: string
	action: string
}

function SyntwinCTA({ title, description, creator, action }: SyntwinCTAProps) {
	if (!PUBLIC_SYNTWIN_ENABLED || !PUBLIC_SYNTWIN_ROOM_ID) return null

	return (
		<div className="container mx-auto px-6 md:px-8">
			<button
				type="button"
				data-syntwin-open
				className="group border-border bg-card/40 hover:border-primary/60 hover:bg-card focus-visible:ring-ring focus-visible:ring-offset-background mx-auto flex w-full max-w-3xl cursor-pointer flex-col gap-5 rounded-2xl border p-5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
			>
				<span className="flex min-w-0 flex-1 items-start gap-4 sm:items-center sm:gap-5">
					<span className="relative shrink-0">
						<img
							src="/images/avatars/carl.webp"
							alt=""
							width={64}
							height={64}
							className="bg-muted size-12 rounded-full sm:size-16"
						/>
						<span
							aria-hidden="true"
							className="bg-primary ring-background absolute right-0 bottom-0 size-3 rounded-full ring-2 sm:size-3.5"
						/>
					</span>
					<span className="flex min-w-0 flex-col gap-1">
						<span className="text-muted-foreground text-xs sm:text-sm">
							{creator}
						</span>
						<span className="text-foreground text-lg/6 font-semibold tracking-tight sm:text-xl/7">
							{title}
						</span>
						<span className="text-muted-foreground text-sm/6">
							{description}
						</span>
					</span>
				</span>
				<span className="bg-primary text-primary-foreground group-hover:bg-primary/90 inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors">
					{action}
					<ArrowRight
						aria-hidden="true"
						className="size-4 transition-transform group-hover:translate-x-0.5"
					/>
				</span>
			</button>
		</div>
	)
}
