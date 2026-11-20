import { describe, expect, it } from "vitest"
import { Linter } from "eslint"
import * as parser from "@typescript-eslint/parser"
import plugin from "../../index.js"

// Runs real ESLint so the tests prove that the processor's reports survive
// the very directives they report.
let linter = new Linter({ configType: "flat" })
let config = [
	{
		files: ["**/*.test.ts"],
		languageOptions: { parser },
		linterOptions: { reportUnusedDisableDirectives: "off" },
		plugins: { architecture: plugin },
		processor: "architecture/expect-tests",
		rules: { "architecture/expect-tests-only": "error" },
	},
] as Linter.Config[]

function lint(code: string) {
	return linter
		.verify(code, config, "src/example.test.ts")
		.map(({ line, message }) => `${line}: ${message}`)
}

let invalid = {
	"next-line disable without reason": `
// eslint-disable-next-line architecture/expect-tests-only
expect(1).toBe(1)`,
	"next-line disable with a non-invariant reason": `
// eslint-disable-next-line architecture/expect-tests-only -- simpler this way
expect(1).toBe(1)`,
	"next-line disable with an empty invariant": `
// eslint-disable-next-line architecture/expect-tests-only -- invariant:
expect(1).toBe(1)`,
	"same-line disable without invariant": `
expect(1).toBe(1) // eslint-disable-line architecture/expect-tests-only -- because`,
	"block disable, even with invariant": `
/* eslint-disable architecture/expect-tests-only -- invariant: all of them */
expect(1).toBe(1)`,
	"file-wide disable without rule list": `
/* eslint-disable */
expect(1).toBe(1)`,
	"next-line disable without rule list": `
// eslint-disable-next-line -- invariant: everything
expect(1).toBe(1)`,
	"inline config turning the rule off": `
/* eslint architecture/expect-tests-only: "off" */
expect(1).toBe(1)`,
	"inline config with a quoted rule": `
/* eslint "architecture/expect-tests-only": 0 */
expect(1).toBe(1)`,
}

describe("expect-tests processor", () => {
	for (let [name, code] of Object.entries(invalid)) {
		it(`reports ${name}`, () => {
			let directiveProblems = lint(code).filter(problem =>
				problem.startsWith("2: "),
			)
			expect(directiveProblems.join("\n")).toContain(
				"architecture/expect-tests-only",
			)
		})
	}

	it("allows a next-line opt-out with an invariant reason", () => {
		let problems = lint(`
// eslint-disable-next-line architecture/expect-tests-only -- invariant: deleted notes never reach the AI
expect(1).toBe(1)`)
		expect(problems).toEqual([])
	})

	it("allows a same-line opt-out with an invariant reason", () => {
		let problems = lint(
			`expect(1).toBe(1) // eslint-disable-line architecture/expect-tests-only -- invariant: x`,
		)
		expect(problems).toEqual([])
	})

	it("ignores disables of other rules", () => {
		let problems = lint(`
// eslint-disable-next-line architecture/no-deep-feature-imports -- fixture
import { value } from "#app/features/notes/parts/NoteItem"
expect(value).toMatchInlineSnapshot()`)
		expect(problems).toEqual([])
	})

	it("reports the directive and nothing else for a file-wide disable", () => {
		expect(lint(invalid["file-wide disable without rule list"])).toEqual([
			"2: eslint-disable without a rule list also disables architecture/expect-tests-only. Name the rules to disable.",
		])
	})
})
