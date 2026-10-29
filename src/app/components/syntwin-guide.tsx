import { useEffect } from "react"
import {
	PUBLIC_SYNTWIN_ENABLED,
	PUBLIC_SYNTWIN_ROOM_ID,
} from "astro:env/client"

export { SyntwinGuide }

function SyntwinGuide({ locale }: { locale: string }) {
	useEffect(() => {
		document.documentElement.lang = locale
		if (
			!PUBLIC_SYNTWIN_ENABLED ||
			!PUBLIC_SYNTWIN_ROOM_ID ||
			document.getElementById("tilly-syntwin")
		) {
			return
		}

		// Syntwin reads the page language once, so wait for the account locale.
		let script = document.createElement("script")
		script.id = "tilly-syntwin"
		script.src = "https://my.syntwin.ai/omny.js"
		script.async = true
		script.dataset.room = PUBLIC_SYNTWIN_ROOM_ID
		script.dataset.launcher = "none"
		document.body.append(script)
	}, [locale])

	return null
}
