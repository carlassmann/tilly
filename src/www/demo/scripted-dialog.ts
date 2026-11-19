import { useEffect } from "react"
import { testIds } from "#shared/lib/test-ids"
import type { DemoDialog } from "./demo-script"

export { useScriptedDialog, typeInto }

// Opens and fills the app's own dialogs the way a visitor would: a click on
// its add button, then typing into its field. Saving is left to the script,
// which shows the note or reminder as the dialog closes.
function useScriptedDialog(dialog: DemoDialog | null, isEnabled: boolean) {
	let kind = dialog?.kind
	let text = dialog?.text ?? ""

	useEffect(() => {
		if (!isEnabled) return
		let attempts = 0
		let frame = 0

		function apply() {
			let open = document.querySelector<HTMLElement>('[role="dialog"]')
			if (!kind) {
				if (open) pressEscape(open)
				return
			}
			let field = document.querySelector<HTMLTextAreaElement>(
				`[role="dialog"] [data-testid="${fields[kind]}"]`,
			)
			if (field) {
				typeInto(field, text)
				return
			}
			if (!open) {
				document
					.querySelector<HTMLElement>(`[data-testid="${triggers[kind]}"]`)
					?.click()
			}
			// The screen or the dialog may still be on its way in.
			if (++attempts < 60) frame = requestAnimationFrame(apply)
		}

		frame = requestAnimationFrame(apply)
		return () => cancelAnimationFrame(frame)
	}, [kind, text, isEnabled])
}

let triggers = {
	note: testIds.note.newButton,
	reminder: testIds.reminder.newButton,
} as const

let fields = {
	note: testIds.note.formContentInput,
	reminder: testIds.reminder.formTextInput,
} as const

// React tracks the field's value itself, so the value is set through the
// native setter for it to see the input event as a change.
function typeInto(field: HTMLTextAreaElement, text: string) {
	if (field.value === text) return
	let setValue = Object.getOwnPropertyDescriptor(
		HTMLTextAreaElement.prototype,
		"value",
	)?.set
	setValue?.call(field, text)
	field.dispatchEvent(new Event("input", { bubbles: true }))
}

function pressEscape(target: HTMLElement) {
	target.dispatchEvent(
		new KeyboardEvent("keydown", {
			key: "Escape",
			bubbles: true,
			cancelable: true,
		}),
	)
}
