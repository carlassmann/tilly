import { Button } from "#shared/ui/button"

export { Hero }

interface HeroProps {
	badge?: {
		text: string
		href: string
		description: string
	}
	title: string
	description: string
	primaryCta: {
		text: string
		href: string
	}
	secondaryCta: {
		text: string
		href: string
	}
}

function Hero({
	badge,
	title,
	description,
	primaryCta,
	secondaryCta,
}: HeroProps) {
	return (
		<div className="flex flex-col items-start gap-7">
			{badge && (
				<a
					href={badge.href}
					className="border-border bg-background hover:border-primary/40 group inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors"
				>
					<span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
						{badge.text}
					</span>
					<span className="text-muted-foreground group-hover:text-foreground transition-colors">
						{badge.description} <span aria-hidden="true">→</span>
					</span>
				</a>
			)}
			<h1 className="text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.02] font-bold tracking-tight text-balance">
				{title}
			</h1>
			<p className="text-muted-foreground max-w-[34ch] text-xl leading-relaxed text-pretty">
				{description}
			</p>
			<div
				className="flex flex-wrap items-center gap-3"
				data-syntwin-avoid="0px"
			>
				<Button
					size="lg"
					className="h-12 px-6 text-base pointer-fine:h-12"
					nativeButton={false}
					render={<a href={primaryCta.href} />}
				>
					{primaryCta.text}
				</Button>
				<Button
					size="lg"
					className="h-12 px-6 text-base pointer-fine:h-12"
					variant="ghost"
					nativeButton={false}
					render={<a href={secondaryCta.href} />}
				>
					{secondaryCta.text} <span aria-hidden="true">↓</span>
				</Button>
			</div>
		</div>
	)
}
