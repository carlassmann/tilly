import { Badge } from "#shared/ui/badge"
import { TypographyH2, TypographyLead } from "#shared/ui/typography"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	UserIcon,
	Notification01Icon,
	SmartPhone01Icon,
	ChatIcon,
	CloudIcon,
	LockIcon,
} from "@hugeicons/core-free-icons"

export { FeatureGridCentered }

interface Props {
	badge?: string
	title: string
	description?: string
	features: {
		name: string
		description: string
		icon: string
	}[]
}

let iconMap = {
	PersonHearts: { icon: UserIcon },
	Bell: { icon: Notification01Icon },
	PhoneFill: { icon: SmartPhone01Icon },
	Chat: { icon: ChatIcon },
	Download: { icon: LockIcon },
	CloudCheck: { icon: CloudIcon },
}

function FeatureGridCentered({ badge, title, description, features }: Props) {
	return (
		<div className="container mx-auto max-w-5xl px-6 md:px-8">
			<div className="max-w-2xl">
				{badge && (
					<Badge variant="outline" className="mb-4">
						{badge}
					</Badge>
				)}
				<TypographyH2>{title}</TypographyH2>
				{description && (
					<TypographyLead className="mt-4">{description}</TypographyLead>
				)}
			</div>

			<div className="mt-12 md:mt-16">
				<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
					{features.map(feature => {
						let iconData = iconMap[feature.icon as keyof typeof iconMap]
						return (
							<div
								key={feature.name}
								className="border-border bg-card rounded-3xl border p-6"
							>
								<dt className="text-foreground text-base font-semibold">
									<div className="bg-primary/10 mb-5 flex size-11 items-center justify-center rounded-2xl">
										<HugeiconsIcon
											icon={iconData.icon}
											className="text-primary size-6"
										/>
									</div>
									{feature.name}
								</dt>
								<dd className="text-muted-foreground mt-3 text-sm leading-relaxed">
									{feature.description}
								</dd>
							</div>
						)
					})}
				</dl>
			</div>
		</div>
	)
}
