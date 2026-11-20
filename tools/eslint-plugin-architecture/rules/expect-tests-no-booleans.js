import { ESLintUtils } from "@typescript-eslint/utils"
import ts from "typescript"
import {
	collectChain,
	createRule,
	isPollSubject,
	propertyName,
	subjectCallOf,
	vitestExpectReferences,
} from "../utils/expect-calls.js"

const CONVERTING_FUNCTIONS = new Set(["String", "Number"])
const CONVERTING_UNARY_OPERATORS = new Set(["+", "-", "~"])
const HIDDEN_VALUES = "hides the values it was computed from"

export default createRule({
	name: "expect-tests-no-booleans",
	meta: {
		type: "problem",
		docs: {
			description:
				"Expect tests snapshot values, not booleans computed from them.",
		},
		messages: {
			booleanSubject: `Snapshotting a boolean ${HIDDEN_VALUES}. Snapshot the values themselves.`,
			booleanArray: `Snapshotting a list of booleans ${HIDDEN_VALUES}. Snapshot the values themselves.`,
			booleanInTemplate: `A boolean inside a template string in expect(...) ${HIDDEN_VALUES}. Snapshot the values themselves.`,
			convertedBoolean: `Converting a boolean in expect(...) ${HIDDEN_VALUES}. Snapshot the values themselves.`,
			boxedBoolean:
				"`new Boolean(...)` gets a boolean past the snapshot guard. Snapshot the values themselves.",
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		let services = ESLintUtils.getParserServices(context)
		let checker = services.program.getTypeChecker()

		function typeOf(node) {
			return services.getTypeAtLocation(node)
		}

		function isBoolean(node) {
			return isBooleanType(typeOf(node))
		}

		function isBooleanList(type) {
			if (checker.isTupleType(type)) {
				let elements = checker.getTypeArguments(type)
				return elements.length > 0 && elements.every(isBooleanType)
			}
			return (
				checker.isArrayType(type) &&
				isBooleanType(checker.getTypeArguments(type)[0])
			)
		}

		function hidesBoolean(node) {
			return isBoolean(node) || isBooleanList(typeOf(node))
		}

		// expect(x) checks x; expect(p).resolves and expect.poll(fn) check
		// what p and fn resolve to.
		function subjectValueType(subject, chain) {
			let type = typeOf(subject.arguments[0])
			if (isPollSubject(subject)) {
				let [signature] = type.getCallSignatures()
				if (!signature) return type
				type = checker.getReturnTypeOfSignature(signature)
			}
			if (isPollSubject(subject) || chain.includes("resolves")) {
				type = checker.getAwaitedType(type) ?? type
			}
			return type
		}

		// String(b), Number(b), JSON.stringify(b), b.toString(), b ? "x" : "y",
		// +b, b + ""
		function convertsBoolean(node) {
			switch (node.type) {
				case "CallExpression":
					return (
						(isConvertingCall(node) &&
							node.arguments[0] &&
							hidesBoolean(node.arguments[0])) ||
						(isToStringCall(node) && isBoolean(node.callee.object))
					)
				case "ConditionalExpression":
					return (
						isBoolean(node.test) &&
						isStaticLiteral(node.consequent) &&
						isStaticLiteral(node.alternate)
					)
				case "UnaryExpression":
					return (
						CONVERTING_UNARY_OPERATORS.has(node.operator) &&
						isBoolean(node.argument)
					)
				case "BinaryExpression":
					return (
						node.operator === "+" &&
						(isBoolean(node.left) || isBoolean(node.right))
					)
				default:
					return false
			}
		}

		// The subject itself or an element of an array written in it: a
		// converted boolean as an object field is just a boolean field.
		function booleanConversionsIn(node) {
			if (convertsBoolean(node)) return [node]
			if (node.type === "SpreadElement") {
				return booleanConversionsIn(node.argument)
			}
			if (node.type !== "ArrayExpression") return []
			return node.elements.filter(Boolean).flatMap(booleanConversionsIn)
		}

		function checkSubject(subject) {
			let value = subject.arguments[0]
			if (!value || value.type === "SpreadElement") return
			let { chain } = collectChain(subject)
			let type = subjectValueType(subject, chain)
			if (isBooleanType(type)) {
				context.report({ node: value, messageId: "booleanSubject" })
				return
			}
			if (isBooleanList(type)) {
				context.report({ node: value, messageId: "booleanArray" })
				return
			}
			if (isPollSubject(subject)) return
			for (let node of booleanConversionsIn(value)) {
				context.report({ node, messageId: "convertedBoolean" })
			}
			for (let expression of templateExpressionsIn(value)) {
				if (!isBoolean(expression)) continue
				context.report({ node: expression, messageId: "booleanInTemplate" })
			}
		}

		return {
			NewExpression(node) {
				if (node.callee.type !== "Identifier") return
				if (node.callee.name !== "Boolean") return
				context.report({ node, messageId: "boxedBoolean" })
			},
			"Program:exit"(program) {
				for (let identifier of vitestExpectReferences(
					context.sourceCode,
					program,
				)) {
					let subject = subjectCallOf(identifier)
					if (subject) checkSubject(subject)
				}
			},
		}
	},
})

// boolean is the union true | false, so check every member.
function isBooleanType(type) {
	let members = type.isUnion() ? type.types : [type]
	return members.every(member => member.flags & ts.TypeFlags.BooleanLike)
}

function isConvertingCall(node) {
	let { callee } = node
	if (callee.type === "Identifier") {
		return CONVERTING_FUNCTIONS.has(callee.name)
	}
	return (
		callee.type === "MemberExpression" &&
		callee.object.type === "Identifier" &&
		callee.object.name === "JSON" &&
		propertyName(callee) === "stringify"
	)
}

function isToStringCall(node) {
	return (
		node.callee.type === "MemberExpression" &&
		propertyName(node.callee) === "toString"
	)
}

function isStaticLiteral(node) {
	return (
		node.type === "Literal" ||
		(node.type === "TemplateLiteral" && node.expressions.length === 0)
	)
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
