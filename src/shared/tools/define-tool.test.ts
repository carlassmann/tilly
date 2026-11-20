import { describe, expect, test } from "vitest"
import { z } from "zod"
import {
	defineTool,
	operationSchema,
	deletedSchema,
	mutationSchema,
	type Worker,
} from "#shared/tools/define-tool"

let stubWorker = undefined as unknown as Worker

describe("defineTool — server tool", () => {
	let buildEcho = () =>
		defineTool({
			description: "echo",
			input: z.object({ value: z.string() }),
			output: z.object({ echoed: z.string() }),
			serverOp: async (_worker, input) => ({ echoed: input.value }),
		})

	test("returns a worker-bound factory with execute", () => {
		let tool = buildEcho()(stubWorker)
		expect(typeof tool.execute).toMatchInlineSnapshot(`"function"`)
	})

	test("execute passes success through", async () => {
		let tool = buildEcho()(stubWorker)
		let out = await tool.execute!({ value: "hi" }, fakeOptions())
		expect(out).toMatchInlineSnapshot(`
			{
			  "echoed": "hi",
			}
		`)
	})

	test("execute wraps thrown errors as { error }", async () => {
		let tool = defineTool({
			description: "boom",
			input: z.object({}),
			output: z.object({ ok: z.boolean() }),
			serverOp: async () => {
				throw new Error("kaboom")
			},
		})(stubWorker)
		let out = await tool.execute!({}, fakeOptions())
		expect(out).toMatchInlineSnapshot(`
			{
			  "error": "kaboom",
			}
		`)
	})

	test("output schema unions error branch with success", () => {
		let tool = buildEcho()(stubWorker)
		let schema = tool.outputSchema as unknown as z.ZodType
		expect(schema.safeParse({ error: "nope" })).toMatchInlineSnapshot(`
			{
			  "data": {
			    "error": "nope",
			  },
			  "success": true,
			}
		`)
	})
})

describe("defineTool — client tool", () => {
	test("omitting serverOp yields a tool without execute", () => {
		let clientTool = defineTool({
			description: "client-side",
			input: z.object({ q: z.string() }),
			output: z.object({ a: z.string() }),
		})
		expect(clientTool.execute).toMatchInlineSnapshot(`undefined`)
	})

	test("cancellable adds the cancelled branch", () => {
		let clientTool = defineTool({
			description: "ask",
			input: z.object({ q: z.string() }),
			output: z.object({ answer: z.string() }),
			cancellable: true,
		})
		let schema = clientTool.outputSchema as unknown as z.ZodType
		expect(schema.safeParse({ cancelled: true, reason: "user closed" }))
			.toMatchInlineSnapshot(`
			{
			  "data": {
			    "cancelled": true,
			    "reason": "user closed",
			  },
			  "success": true,
			}
		`)
	})

	test("non-cancellable rejects cancelled output", () => {
		let clientTool = defineTool({
			description: "no-cancel",
			input: z.object({}),
			output: z.object({ ok: z.boolean() }),
		})
		let schema = clientTool.outputSchema as unknown as z.ZodType
		let { error } = schema.safeParse({ cancelled: true, reason: "x" })
		expect(error && z.prettifyError(error)).toMatchInlineSnapshot(
			`"✖ Invalid input"`,
		)
	})
})

describe("operationSchema / deletedSchema", () => {
	let current = z.object({ id: z.string(), name: z.string() })

	test("accept each operation shape", () => {
		let create = { operation: "create", current: { id: "1", name: "Ada" } }
		let update = { ...create, operation: "update", previous: create.current }
		let deleted = { operation: "delete", previous: create.current }
		let cases: [string, z.ZodType, unknown][] = [
			["operationSchema create", operationSchema(current), create],
			["operationSchema update", operationSchema(current), update],
			["deletedSchema delete", deletedSchema(current), deleted],
			["mutationSchema create", mutationSchema(current), create],
			["mutationSchema update", mutationSchema(current), update],
			["mutationSchema delete", mutationSchema(current), deleted],
		]
		let table = cases.map(
			([label, schema, value]) =>
				`${label} -> ${schema.safeParse(value).success}`,
		)
		expect(table).toMatchInlineSnapshot(`
			[
			  "operationSchema create -> true",
			  "operationSchema update -> true",
			  "deletedSchema delete -> true",
			  "mutationSchema create -> true",
			  "mutationSchema update -> true",
			  "mutationSchema delete -> true",
			]
		`)
	})
})

function fakeOptions() {
	return {
		toolCallId: "test",
		messages: [],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests only need the fields execute reads
	} as any
}
