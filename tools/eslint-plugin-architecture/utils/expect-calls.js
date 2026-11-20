// Shared by expect-tests-only and expect-tests-no-booleans: finding vitest's
// `expect` and the assertion chains hanging off it.

import { ESLintUtils } from "@typescript-eslint/utils"

export const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const SUBJECT_VARIANTS = new Set(["soft", "poll"])

// References to the `expect` exported by vitest: imported (also renamed) or
// the global that `globals: true` provides.
export function vitestExpectReferences(sourceCode, program) {
	let importedReferences = program.body
		.filter(isVitestImport)
		.flatMap(declaration => declaration.specifiers)
		.filter(specifier => importedName(specifier) === "expect")
		.flatMap(specifier => sourceCode.getDeclaredVariables(specifier))
		.flatMap(variable => variable.references)
		.map(reference => reference.identifier)
	return [
		...globalReferences(sourceCode, program, "expect"),
		...importedReferences,
	].filter(identifier => identifier.parent.type !== "TSTypeQuery")
}

// Identifiers referring to a global, declared in the config or not.
export function globalReferences(sourceCode, program, name) {
	let globalScope = sourceCode.getScope(program)
	let identifiers = [
		...(globalScope.set.get(name)?.references ?? []),
		...globalScope.through.filter(
			reference => reference.identifier.name === name,
		),
	].map(reference => reference.identifier)
	return [...new Set(identifiers)]
}

// expect(x), expect.soft(x), expect.poll(fn): the call whose argument is
// the value under test, or null for any other use of `expect`.
export function subjectCallOf(expectIdentifier) {
	let { parent } = expectIdentifier
	if (isCalleeOf(parent, expectIdentifier)) return parent
	let isVariant =
		parent.type === "MemberExpression" &&
		parent.object === expectIdentifier &&
		SUBJECT_VARIANTS.has(propertyName(parent)) &&
		isCalleeOf(parent.parent, parent)
	return isVariant ? parent.parent : null
}

export function isPollSubject(subject) {
	return (
		subject.callee.type === "MemberExpression" &&
		propertyName(subject.callee) === "poll"
	)
}

// expect(x).resolves.not.toBe(1) -> chain ["resolves", "not", "toBe"]
export function collectChain(subject) {
	let chain = []
	let current = subject
	while (
		current.parent.type === "MemberExpression" &&
		current.parent.object === current
	) {
		current = current.parent
		chain.push(propertyName(current))
	}
	let matcherCall = isCalleeOf(current.parent, current) ? current.parent : null
	return { chain, matcherCall }
}

export function propertyName(memberExpression) {
	let { property } = memberExpression
	if (!memberExpression.computed && property.type === "Identifier") {
		return property.name
	}
	if (property.type === "Literal") return String(property.value)
	return "[computed]"
}

export function isCalleeOf(node, callee) {
	return node?.type === "CallExpression" && node.callee === callee
}

function isVitestImport(node) {
	return node.type === "ImportDeclaration" && node.source.value === "vitest"
}

function importedName(specifier) {
	if (specifier.type !== "ImportSpecifier") return null
	return specifier.imported.name ?? specifier.imported.value
}
