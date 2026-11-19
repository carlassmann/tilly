import { TypographyH2, TypographyLead } from "#shared/ui/typography"

export { Testimonials }

interface Props {
	title: string
	subtitle?: string
	testimonials: { quote: string; author?: string }[]
}

function Testimonials({ title, subtitle, testimonials }: Props) {
	return (
		<div className="container mx-auto max-w-5xl px-6 md:px-8">
			<div className="max-w-2xl">
				<TypographyH2>{title}</TypographyH2>
				{subtitle && (
					<TypographyLead className="mt-4">{subtitle}</TypographyLead>
				)}
			</div>
			<div className="mt-12 md:mt-16">
				<div className="gap-4 md:columns-2">
					{testimonials.map((testimonial, index) => (
						<figure
							key={index}
							className="bg-muted/50 mb-4 break-inside-avoid rounded-3xl p-8"
						>
							<blockquote className="text-foreground text-xl/8 font-medium tracking-tight text-pretty">
								<p>&ldquo;{testimonial.quote}&rdquo;</p>
							</blockquote>
							{testimonial.author && (
								<figcaption className="text-muted-foreground mt-6 text-sm">
									— {testimonial.author}
								</figcaption>
							)}
						</figure>
					))}
				</div>
			</div>
		</div>
	)
}
