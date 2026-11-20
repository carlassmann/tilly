import { ESLintUtils } from "@typescript-eslint/utils"
import ts from "typescript"
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
const TEST_FUNCTIONS = new Set([
	"test",
	"it",
	"beforeEach",
	"afterEach",
	"beforeAll",
	"afterAll",
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
			booleanSubject:
				"Snapshotting a boolean hides the values it was computed from. Snapshot the values themselves.",
			booleanInTemplate:
				"A boolean inside a template string in expect(...) hides the values it was computed from. Snapshot the values themselves.",
			throwInTest:
				"`throw` in a test or hook asserts by hand. Snapshot the value, or move type-narrowing setup into a helper function.",
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		let expectNames = new Set(["expect"])
		let services = ESLintUtils.getParserServices(context)
		let checker = services.program.getTypeChecker()

		function isBoolean(node, { awaited = false } = {}) {
			let type = services.getTypeAtLocation(node)
			if (awaited) type = checker.getAwaitedType(type) ?? type
			return isBooleanType(type)
		}

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

		function checkSubjectValue(subject, chain) {
			let value = subject.arguments[0]
			if (!value || value.type === "SpreadElement") return
			if (isBoolean(value, { awaited: chain.includes("resolves") })) {
				context.report({ node: value, messageId: "booleanSubject" })
				return
			}
			for (let expression of templateExpressionsIn(value)) {
				if (!isBoolean(expression)) continue
				context.report({ node: expression, messageId: "booleanInTemplate" })
			}
		}

		function checkMatcherChain(subject) {
			let { chain, matcherCall } = collectChain(subject)
			checkSubjectValue(subject, chain)
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
			ThrowStatement(node) {
				if (!isTestCallback(enclosingFunction(node))) return
				context.report({ node, messageId: "throwInTest" })
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

// boolean is the union true | false, so check every member.
function isBooleanType(type) {
	let members = type.isUnion() ? type.types : [type]
	return members.every(member => member.flags & ts.TypeFlags.BooleanLike)
}

// Only literals spelled out in the subject: a template built elsewhere and
// passed in is a string the author chose to snapshot.
function templateExpressionsIn(node) {
	switch (node.type) {
		case "TemplateLiteral":
			return node.expressions
		case "ArrayExpression":
			return node.elements.filter(Boolean).flatMap(templateExpressionsIn)
		case "ObjectExpression":
			return node.properties.flatMap(property =>
				property.type === "Property"
					? templateExpressionsIn(property.value)
					: [],
			)
		case "SpreadElement":
			return templateExpressionsIn(node.argument)
		default:
			return []
	}
}

function enclosingFunction(node) {
	let current = node.parent
	while (current && !isFunction(current)) current = current.parent
	return current
}

function isFunction(node) {
	return (
		node.type === "FunctionDeclaration" ||
		node.type === "FunctionExpression" ||
		node.type === "ArrowFunctionExpression"
	)
}

// test("name", fn), it.only("name", fn), test.each(rows)("name", fn), beforeEach(fn)
function isTestCallback(fn) {
	let call = fn?.parent
	if (call?.type !== "CallExpression" || !call.arguments.includes(fn)) {
		return false
	}
	return TEST_FUNCTIONS.has(rootIdentifierName(call.callee))
}

function rootIdentifierName(node) {
	let current = node
	while (
		current.type === "MemberExpression" ||
		current.type === "CallExpression"
	) {
		current =
			current.type === "MemberExpression" ? current.object : current.callee
	}
	return current.type === "Identifier" ? current.name : null
}
