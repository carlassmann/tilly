import { ESLintUtils } from "@typescript-eslint/utils"
const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)
const ALLOWED_MATCHERS = new Set([
	"toMatchInlineSnapshot",
	"toThrow",
	"toThrowError",
	"toThrowErrorMatchingInlineSnapshot",
])
const EXPECT_VARIANTS = new Set(["soft", "poll"])
const COMPARISON_OPERATORS = new Set([
	"===",
	"!==",
	"==",
	"!=",
	"<",
	">",
	"<=",
	">=",
])
const ASSERT_MODULES = new Set([
	"assert",
	"assert/strict",
	"node:assert",
	"node:assert/strict",
])
const ASSERT_STYLE_EXPORTS = new Set(["assert", "should"])
const TEST_FRAMEWORKS = new Set(["vitest", "chai"])
const ALLOWED_LIST = [...ALLOWED_MATCHERS].join(", ")

export default createRule({
	name: "expect-tests-only",
	meta: {
		type: "problem",
		docs: {
			description:
				"Unit tests snapshot real output instead of hand-writing expected values.",
		},
		messages: {
			disallowedMatcher: `\`{{matcher}}\` hand-writes the expected value. Use one of: ${ALLOWED_LIST}.`,
			negatedMatcher:
				"`.not.{{matcher}}` asserts by hand. Snapshot the value instead.",
			missingMatcher: `expect(...) must end in a matcher call: ${ALLOWED_LIST}.`,
			assertStyle:
				"`{{name}}` hand-writes the expected value. Snapshot real output with toMatchInlineSnapshot.",
			comparisonInSubject:
				"`{{operator}}` inside expect(...) hides the compared values. Snapshot the values themselves.",
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		let expectNames = new Set(["expect"])

		function isExpectSubject(node) {
			if (node.type !== "CallExpression") return false
			let { callee } = node
			if (callee.type === "Identifier") return expectNames.has(callee.name)
			return (
				callee.type === "MemberExpression" &&
				callee.object.type === "Identifier" &&
				expectNames.has(callee.object.name) &&
				EXPECT_VARIANTS.has(propertyName(callee))
			)
		}

		function checkMatcherChain(subject) {
			let { chain, matcherCall } = collectChain(subject)
			let matcher = chain.at(-1)
			if (!matcherCall || !matcher) {
				context.report({ node: subject, messageId: "missingMatcher" })
				return
			}
			if (!ALLOWED_MATCHERS.has(matcher)) {
				context.report({
					node: matcherCall,
					messageId: "disallowedMatcher",
					data: { matcher },
				})
				return
			}
			if (chain.includes("not")) {
				context.report({
					node: matcherCall,
					messageId: "negatedMatcher",
					data: { matcher },
				})
			}
		}

		function isInsideExpectSubject(node) {
			let ancestors = context.sourceCode.getAncestors(node)
			let child = node
			for (let ancestor of ancestors.toReversed()) {
				if (isExpectSubject(ancestor) && ancestor.arguments[0] === child) {
					return true
				}
				child = ancestor
			}
			return false
		}

		return {
			ImportDeclaration(node) {
				let source = node.source.value
				if (ASSERT_MODULES.has(source)) {
					context.report({
						node,
						messageId: "assertStyle",
						data: { name: source },
					})
					return
				}
				if (!TEST_FRAMEWORKS.has(source)) return
				for (let specifier of node.specifiers) {
					if (specifier.type !== "ImportSpecifier") continue
					let imported = specifier.imported.name ?? specifier.imported.value
					if (imported === "expect") expectNames.add(specifier.local.name)
					if (ASSERT_STYLE_EXPORTS.has(imported)) {
						context.report({
							node: specifier,
							messageId: "assertStyle",
							data: { name: imported },
						})
					}
				}
			},
			CallExpression(node) {
				if (isAssertCall(node)) {
					context.report({
						node,
						messageId: "assertStyle",
						data: { name: "assert" },
					})
					return
				}
				if (isExpectSubject(node)) checkMatcherChain(node)
			},
			BinaryExpression(node) {
				if (!COMPARISON_OPERATORS.has(node.operator)) return
				if (!isInsideExpectSubject(node)) return
				context.report({
					node,
					messageId: "comparisonInSubject",
					data: { operator: node.operator },
				})
			},
		}
	},
})

// expect(x).resolves.not.toBe(1) -> chain ["resolves", "not", "toBe"]
function collectChain(subject) {
	let chain = []
	let current = subject
	while (
		current.parent.type === "MemberExpression" &&
		current.parent.object === current
	) {
		current = current.parent
		chain.push(propertyName(current))
	}
	let isCalled =
		current.parent.type === "CallExpression" &&
		current.parent.callee === current
	return { chain, matcherCall: isCalled ? current.parent : null }
}

function propertyName(memberExpression) {
	let { property } = memberExpression
	if (!memberExpression.computed && property.type === "Identifier") {
		return property.name
	}
	if (property.type === "Literal") return String(property.value)
	return "[computed]"
}

function isAssertCall(node) {
	let { callee } = node
	if (callee.type === "Identifier") return callee.name === "assert"
	return (
		callee.type === "MemberExpression" &&
		callee.object.type === "Identifier" &&
		callee.object.name === "assert"
	)
}
