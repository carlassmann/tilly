import { TypographyH2 } from "#shared/ui/typography"
import { buttonVariants } from "#shared/ui/button"
import { cn } from "#app/lib/utils"

export { CTA }

interface Props {
	title: string
	primaryCta: {
		text: string
		href: string
	}
	secondaryCta?: {
		text: string
		href: string
	}
}

function CTA({ title, primaryCta, secondaryCta }: Props) {
	return (
		<div className="container mx-auto max-w-5xl px-6 pb-24 md:px-8">
			<div className="bg-primary text-primary-foreground flex flex-col items-start gap-8 rounded-[2rem] px-8 py-12 md:flex-row md:items-center md:justify-between md:px-12 md:py-16">
				<TypographyH2 className="text-primary-foreground max-w-[18ch] text-4xl text-balance">
					{title}
				</TypographyH2>
				<div className="flex items-center gap-x-6 md:shrink-0">
					<a
						href={primaryCta.href}
						className={cn(
							buttonVariants({ variant: "secondary" }),
							"h-12 px-6 text-base pointer-fine:h-12",
						)}
					>
						{primaryCta.text}
					</a>
					{secondaryCta && (
						<a
							href={secondaryCta.href}
							className="text-sm/6 font-semibold pointer-fine:hover:opacity-80"
						>
							{secondaryCta.text}
							<span aria-hidden="true">→</span>
						</a>
					)}
				</div>
			</div>
		</div>
	)
}
