import { parse } from "@typescript-eslint/parser"

// Policing opt-outs of the expect-tests rules inside the rules would not
// work: a directive that disables a rule also suppresses the rule's report
// about that directive. Processor postprocess runs after ESLint applied all
// directives, so problems added here cannot be disabled inline.

const RULE_ID = "architecture/expect-tests-only"
const EXPECT_TESTS_RULES = new Set([
	"expect-tests-only",
	"expect-tests-no-booleans",
])
const RULES = "the expect-tests rules"
const DOCS = "see docs/testing.md"
const MESSAGES = {
	missingInvariant: `Opting out of ${RULES} needs a reason: \`-- invariant: <why>\` (${DOCS}).`,
	blockDisable: `Block or file-wide eslint-disable of ${RULES} is not allowed. Opt out single assertions with eslint-disable-next-line and \`-- invariant: <why>\` (${DOCS}).`,
	unlimitedDisable: `eslint-disable without a rule list also disables ${RULES}. Name the rules to disable.`,
	inlineConfig: `Configuring ${RULES} inline is not allowed (${DOCS}).`,
}

let sourceTextByFilename = new Map()

export default {
	meta: { name: "expect-tests", version: "0.1.0" },
	supportsAutofix: true,
	preprocess(text, filename) {
		sourceTextByFilename.set(filename, text)
		return [text]
	},
	postprocess(messagesPerBlock, filename) {
		let text = sourceTextByFilename.get(filename)
		sourceTextByFilename.delete(filename)
		let messages = messagesPerBlock.flat()
		if (text === undefined) return messages
		return [...messages, ...findOptOutViolations(text, filename)]
	},
}

function findOptOutViolations(text, filename) {
	// Skips parsing the many files without any directive.
	if (!text.includes("eslint")) return []
	let comments = parseComments(text, filename)
	return comments.flatMap(comment => {
		let messageId = checkDirective(parseDirective(comment.value))
		if (!messageId) return []
		return [
			{
				ruleId: RULE_ID,
				severity: 2,
				message: MESSAGES[messageId],
				line: comment.loc.start.line,
				column: comment.loc.start.column + 1,
				endLine: comment.loc.end.line,
				endColumn: comment.loc.end.column + 1,
			},
		]
	})
}

function parseComments(text, filename) {
	try {
		return parse(text, { comment: true, jsx: filename.endsWith("x") }).comments
	} catch {
		// ESLint reports the parse error itself.
		return []
	}
}

// Mirrors ESLint's directive syntax: `<kind> <rules> -- <description>`.
function parseDirective(commentValue) {
	let [body, ...descriptionParts] = commentValue.split(/\s-{2,}\s/u)
	let match =
		/^\s*(eslint-disable-next-line|eslint-disable-line|eslint-disable|eslint-enable|eslint)(?:\s|$)/u.exec(
			body,
		)
	if (!match) return null
	let kind = match[1]
	let rules = body
		.slice(match[0].length)
		.split(",")
		.map(entry => entry.trim().split(/[\s:]/u)[0].replaceAll(/["']/gu, ""))
		.filter(Boolean)
	let description = descriptionParts.join(" -- ").trim()
	return { kind, rules, description }
}

function checkDirective(directive) {
	if (!directive || directive.kind === "eslint-enable") return null
	let targetsRule = directive.rules.some(isExpectTestsRule)
	if (directive.kind === "eslint") {
		return targetsRule ? "inlineConfig" : null
	}
	if (directive.rules.length === 0) return "unlimitedDisable"
	if (!targetsRule) return null
	if (directive.kind === "eslint-disable") return "blockDisable"
	return hasInvariantReason(directive.description) ? null : "missingInvariant"
}

function isExpectTestsRule(ruleId) {
	return EXPECT_TESTS_RULES.has(ruleId.split("/").at(-1))
}

function hasInvariantReason(description) {
	let reason = /^invariant:(.*)$/su.exec(description)?.[1]
	return Boolean(reason?.trim())
}
