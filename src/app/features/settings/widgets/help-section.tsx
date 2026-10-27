import {
	PUBLIC_SYNTWIN_ENABLED,
	PUBLIC_SYNTWIN_ROOM_ID,
} from "astro:env/client"
import { Button, buttonVariants } from "#shared/ui/button"
import { T, useIntl } from "#shared/intl/setup"
import { SettingsSection } from "#app/features/settings/parts/settings-section"
import { useOnlineStatus } from "#app/hooks/use-online-status"

export { HelpSection }

function HelpSection() {
	let t = useIntl()
	let isOnline = useOnlineStatus()

	if (!PUBLIC_SYNTWIN_ENABLED || !PUBLIC_SYNTWIN_ROOM_ID) return null

	return (
		<SettingsSection
			title={t("settings.help.title")}
			description={t("settings.help.description")}
		>
			<div className="flex flex-wrap gap-2">
				<Button variant="outline" data-syntwin-open disabled={!isOnline}>
					<T k="settings.help.open" />
				</Button>
				<a
					href="mailto:assmann@hey.com"
					className={buttonVariants({ variant: "outline" })}
				>
					<T k="settings.help.email" />
				</a>
				<a
					href="https://github.com/carlassmann/tilly/issues/new"
					target="_blank"
					rel="noopener noreferrer"
					className={buttonVariants({ variant: "outline" })}
				>
					<T k="settings.help.issue" />
				</a>
			</div>
		</SettingsSection>
	)
}
