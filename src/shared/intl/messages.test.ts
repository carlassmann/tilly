import { test, expect } from "vitest"
import { createIntl } from "@ccssmnn/intl"
import { messagesEn, messagesDe } from "./messages"

test.each([
	["English", () => createIntl(messagesEn, "en")],
	["German", () => createIntl(messagesDe, "de")],
])("all %s messages can be parsed without errors", (_, compile) => {
	expect(compilationErrorsOf(compile)).toMatchInlineSnapshot(`[]`)
})

// createIntl reports MessageFormat compilation errors via console.warn and
// details via console.table instead of throwing.
function compilationErrorsOf(compile: () => void) {
	let errors: unknown[] = []
	let originalWarn = console.warn
	let originalTable = console.table
	console.warn = (message: string) => {
		if (
			message.includes("MessageFormat compilation completed with") &&
			message.includes("error")
		) {
			errors.push(message)
		}
	}
	console.table = (data: unknown) => {
		errors.push(...(Array.isArray(data) ? data : [data]))
	}
	try {
		compile()
	} finally {
		console.warn = originalWarn
		console.table = originalTable
	}
	return errors
}
