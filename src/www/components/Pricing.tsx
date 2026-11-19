import {
	TypographyH2,
	TypographyLead,
	TypographyP,
} from "#shared/ui/typography"
import { Card, CardContent, CardFooter } from "#shared/ui/card"
import { buttonVariants } from "#shared/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { cn } from "#app/lib/utils"

export { Pricing }

interface PricingTier {
	name: string
	id: string
	href: string
	priceMonthly: string
	priceSuffix?: string | null
	description: string
	features: string[]
	featured: boolean
	ctaText?: string
}

interface Props {
	title: string
	subtitle: string
	ctaText?: string
	tiers: PricingTier[]
}

function Pricing({ title, subtitle, ctaText, tiers }: Props) {
	return (
		<div className="container mx-auto max-w-5xl px-6 md:px-8">
			<div className="max-w-2xl">
				<TypographyH2>{title}</TypographyH2>
				<TypographyLead className="mt-4">{subtitle}</TypographyLead>
			</div>
			<div className="mt-12 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-2">
				{tiers.map(tier => (
					<Card
						key={tier.id}
						className={cn(
							"bg-card/60 rounded-3xl",
							tier.featured &&
								"bg-primary/5 border-primary ring-primary/20 shadow-primary/10 shadow-2xl ring-1",
						)}
					>
						<CardContent className="flex h-full flex-col p-8 md:p-10">
							<h3 id={tier.id} className="text-primary font-semibold">
								{tier.name}
							</h3>
							<p className="mt-4 flex items-baseline gap-x-2">
								<span
									className={`text-5xl font-semibold tracking-tight ${
										tier.featured ? "text-foreground" : "text-foreground"
									}`}
								>
									{tier.priceMonthly}
								</span>
								{tier.priceSuffix ? (
									<span className="text-muted-foreground text-base">
										{tier.priceSuffix}
									</span>
								) : null}
							</p>
							<TypographyP
								className={`mt-6 text-base/7 ${
									tier.featured
										? "text-muted-foreground"
										: "text-muted-foreground"
								}`}
							>
								{tier.description}
							</TypographyP>
							<ul
								role="list"
								className="text-muted-foreground mt-8 space-y-3 text-sm/6 md:mt-10"
							>
								{tier.features.map(feature => (
									<li key={feature} className="flex gap-x-3">
										<HugeiconsIcon
											icon={CheckmarkCircle01Icon}
											aria-hidden="true"
											className={`h-6 w-5 flex-none ${
												tier.featured ? "text-primary" : "text-primary"
											}`}
										/>
										{feature}
									</li>
								))}
							</ul>
							<CardFooter className="mt-auto px-0 pt-8">
								<a
									href={tier.href}
									aria-describedby={tier.id}
									className={cn(
										buttonVariants({
											variant: tier.featured ? "default" : "secondary",
										}),
										"h-12 w-full text-base pointer-fine:h-12",
									)}
								>
									{tier.ctaText || ctaText || "Get started"}
								</a>
							</CardFooter>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
