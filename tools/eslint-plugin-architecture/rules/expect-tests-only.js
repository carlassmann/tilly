import {
	collectChain,
	createRule,
	globalReferences,
	isCalleeOf,
	propertyName,
	subjectCallOf,
	vitestExpectReferences,
} from "../utils/expect-calls.js"

const ALLOWED_MATCHERS = new Set([
	"toMatchInlineSnapshot",
	"toThrow",
	"toThrowError",
	"toThrowErrorMatchingInlineSnapshot",
])
const INLINE_SNAPSHOT_MATCHERS = new Set([
	"toMatchInlineSnapshot",
	"toThrowErrorMatchingInlineSnapshot",
])
const SETUP_ONLY_EXPECT_MEMBERS = new Set([
	"extend",
	"addSnapshotSerializer",
	"addEqualityTesters",
])
const TEST_FUNCTIONS = new Set([
	"test",
	"it",
	"beforeEach",
	"afterEach",
	"beforeAll",
	"afterAll",
])
const VITEST = "vitest"
const ASSERTION_LIBRARIES = new Set([
	"chai",
	"expect",
	"@vitest/expect",
	"assert",
	"assert/strict",
	"node:assert",
	"node:assert/strict",
])
const ALLOWED_VITEST_EXPORTS = new Set([
	"describe",
	"suite",
	"test",
	"it",
	"expect",
	"expectTypeOf",
	"assertType",
	"vi",
	"vitest",
	"beforeAll",
	"afterAll",
	"beforeEach",
	"afterEach",
	"aroundAll",
	"aroundEach",
	"onTestFailed",
	"onTestFinished",
	"inject",
])
const ASSERTION_APIS = new Set(["assert", "should", "chai"])
// Properties that reach an assertion API through another object: a vitest
// namespace, the test context or globalThis.
const ASSERTION_PROPERTIES = new Set([
	"expect",
	"createExpect",
	...ASSERTION_APIS,
])
const MODULE_LOADERS = new Set(["require", "importActual", "importMock"])
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
			propertyMatchers:
				"Property matchers hand-write part of the expected value. Snapshot the value; redact noise before the expect.",
			dynamicSnapshot:
				"Snapshot text must be a string or template literal without `${}`, written by vitest.",
			assertStyle:
				"`{{name}}` hand-writes the expected value. Snapshot real output with toMatchInlineSnapshot.",
			disallowedVitestExport:
				"`{{name}}` from vitest is not part of expect tests.",
			vitestNamespace:
				"Import what you need from vitest by name, not the whole module.",
			reexport:
				"Re-exporting `{{source}}` hides where assertions come from. Import it where it is used.",
			moduleLoad:
				"Load `{{source}}` with a static import, so the rule can check how it is used.",
			dynamicModule:
				"Loading a module whose name is computed hides what it is. Use a string literal.",
			expectAlias:
				"Use `expect` only as `expect(...)`, `expect.soft(...)` or `expect.poll(...)`: an alias escapes this rule.",
			assertionProperty:
				"`.{{name}}` reaches an assertion API this rule cannot follow. Use the imported `expect` directly.",
			disallowedExpectMember:
				"`expect.{{name}}` is not part of expect tests. Use expect(...), expect.soft(...) or expect.poll(...).",
			setupOnly:
				"`expect.{{name}}` changes how every test asserts. It belongs in vitest.setup.ts.",
			zeroAssertions:
				"`expect.assertions` needs a positive number literal: every test must assert.",
			throwInTest:
				"`throw` in a test or hook asserts by hand. Snapshot the value, or move type-narrowing setup into a helper function.",
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		let { sourceCode } = context

		function report(node, messageId, data) {
			context.report({ node, messageId, data })
		}

		function checkInlineSnapshotArguments(matcherCall) {
			let [snapshot, ...rest] = matcherCall.arguments
			if (!snapshot) return
			if (rest.length > 0 || snapshot.type === "ObjectExpression") {
				report(matcherCall, "propertyMatchers")
				return
			}
			if (!isStaticString(snapshot)) report(snapshot, "dynamicSnapshot")
		}

		function checkMatcherChain(subject) {
			let { chain, matcherCall } = collectChain(subject)
			let matcher = chain.at(-1)
			if (!matcherCall || !matcher) {
				report(subject, "missingMatcher")
				return
			}
			if (!ALLOWED_MATCHERS.has(matcher)) {
				report(matcherCall, "disallowedMatcher", { matcher })
				return
			}
			if (chain.includes("not")) {
				report(matcherCall, "negatedMatcher", { matcher })
			}
			if (INLINE_SNAPSHOT_MATCHERS.has(matcher)) {
				checkInlineSnapshotArguments(matcherCall)
			}
		}

		function checkExpectMemberCall(call, name) {
			if (name === "hasAssertions") return
			if (name === "assertions") {
				if (!isPositiveNumber(call.arguments[0])) {
					report(call, "zeroAssertions")
				}
				return
			}
			let messageId = SETUP_ONLY_EXPECT_MEMBERS.has(name)
				? "setupOnly"
				: "disallowedExpectMember"
			report(call, messageId, { name })
		}

		function checkExpectReference(identifier) {
			let subject = subjectCallOf(identifier)
			if (subject) {
				checkMatcherChain(subject)
				return
			}
			let { parent } = identifier
			let isMemberCall =
				parent.type === "MemberExpression" &&
				parent.object === identifier &&
				isCalleeOf(parent.parent, parent)
			if (isMemberCall) {
				checkExpectMemberCall(parent.parent, propertyName(parent))
				return
			}
			report(identifier, "expectAlias")
		}

		function checkModuleSource(node, sourceNode) {
			let source = staticString(sourceNode)
			if (source === null) {
				report(node, "dynamicModule")
				return
			}
			if (ASSERTION_LIBRARIES.has(source)) {
				report(node, "assertStyle", { name: source })
			} else if (source === VITEST) {
				report(node, "moduleLoad", { source })
			}
		}

		function checkVitestSpecifier(specifier) {
			if (specifier.importKind === "type") return
			if (specifier.type !== "ImportSpecifier") {
				report(specifier, "vitestNamespace")
				return
			}
			let name = specifier.imported.name ?? specifier.imported.value
			if (ALLOWED_VITEST_EXPORTS.has(name)) return
			let messageId = ASSERTION_APIS.has(name)
				? "assertStyle"
				: "disallowedVitestExport"
			report(specifier, messageId, { name })
		}

		function checkReexport(node) {
			let source = node.source?.value
			if (source === VITEST || ASSERTION_LIBRARIES.has(source)) {
				report(node, "reexport", { source })
			}
		}

		return {
			ImportDeclaration(node) {
				if (node.importKind === "type") return
				let source = node.source.value
				if (ASSERTION_LIBRARIES.has(source)) {
					report(node, "assertStyle", { name: source })
				} else if (source === VITEST) {
					node.specifiers.forEach(checkVitestSpecifier)
				}
			},
			ExportAllDeclaration: checkReexport,
			ExportNamedDeclaration: checkReexport,
			TSImportEqualsDeclaration(node) {
				let reference = node.moduleReference
				if (reference.type !== "TSExternalModuleReference") return
				checkModuleSource(node, reference.expression)
			},
			ImportExpression(node) {
				checkModuleSource(node, node.source)
			},
			CallExpression(node) {
				if (!isModuleLoaderCall(node)) return
				checkModuleSource(node, node.arguments[0])
			},
			MemberExpression(node) {
				let name = propertyName(node)
				if (!ASSERTION_PROPERTIES.has(name)) return
				report(node, "assertionProperty", { name })
			},
			// let { expect } = context, ({ expect }) => ...
			"ObjectPattern > Property"(node) {
				if (propertyKeyName(node) !== "expect") return
				report(node, "assertionProperty", { name: "expect" })
			},
			ThrowStatement(node) {
				if (!isTestCallback(enclosingFunction(node))) return
				report(node, "throwInTest")
			},
			"Program:exit"(program) {
				vitestExpectReferences(sourceCode, program).forEach(
					checkExpectReference,
				)
				for (let name of ASSERTION_APIS) {
					for (let identifier of globalReferences(sourceCode, program, name)) {
						report(identifier, "assertStyle", { name })
					}
				}
			},
		}
	},
})

function isStaticString(node) {
	return staticString(node) !== null
}

function staticString(node) {
	if (node?.type === "Literal" && typeof node.value === "string") {
		return node.value
	}
	if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
		return node.quasis[0].value.cooked
	}
	return null
}

function isPositiveNumber(node) {
	return (
		node?.type === "Literal" && typeof node.value === "number" && node.value > 0
	)
}

// require("x"), vi.importActual("x"), vi.importMock("x")
function isModuleLoaderCall(node) {
	let { callee } = node
	if (callee.type === "Identifier") return MODULE_LOADERS.has(callee.name)
	return (
		callee.type === "MemberExpression" &&
		MODULE_LOADERS.has(propertyName(callee))
	)
}

function propertyKeyName(property) {
	let { key } = property
	if (!property.computed && key.type === "Identifier") return key.name
	if (key.type === "Literal") return String(key.value)
	return null
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
