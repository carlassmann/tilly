import { typedRuleTester } from "../rule-tester.js"
import rule from "../../rules/expect-tests-only.js"

// Declarations give the subjects real types; undeclared names are `any`.
let declarations = `
declare let done: boolean
declare let flag: true
declare let maybe: boolean | undefined
declare let count: number
declare let name: string
declare let items: { id: string; done: boolean }[]
declare function isAdmin(): boolean
declare function check(): Promise<boolean>
`

typedRuleTester.run("expect-tests-only", rule, {
	valid: [
		`expect(summary).toMatchInlineSnapshot()`,
		`expect(summary).toMatchInlineSnapshot(\`"Ada"\`)`,
		`expect(() => parse("")).toThrow("empty")`,
		`expect(() => parse("")).toThrowError(/empty/)`,
		`expect(() => parse("")).toThrowErrorMatchingInlineSnapshot()`,
		`await expect(load()).rejects.toThrow("missing")`,
		`await expect(load()).resolves.toMatchInlineSnapshot()`,
		`expect.soft(summary).toMatchInlineSnapshot()`,
		`await expect.poll(() => count).toMatchInlineSnapshot()`,
		`expect(summary)["toMatchInlineSnapshot"]()`,
		{
			name: "comparisons outside the expect subject",
			code: `let done = items.filter(item => item.done === true); expect(done).toMatchInlineSnapshot()`,
		},
		{
			name: "asymmetric matchers inside a snapshot",
			code: `expect(note).toMatchInlineSnapshot({ id: expect.any(String) })`,
		},
		`import { describe, it, expect } from "vitest"`,
		`expect(\`\${now} -> \${wasDeliveredToday(now)}\`).toMatchInlineSnapshot()`,
		...[
			`expect(items.filter(item => item.done === true)).toMatchInlineSnapshot()`,
			`expect({ done, count }).toMatchInlineSnapshot()`,
			`expect([done, name]).toMatchInlineSnapshot()`,
			`expect(maybe).toMatchInlineSnapshot()`,
			`expect(\`\${name}: \${count}\`).toMatchInlineSnapshot()`,
			`let table = items.map(item => \`\${item.id} -> \${item.done}\`); expect(table).toMatchInlineSnapshot()`,
			`expect(items.map(item => \`\${item.id} -> \${item.done}\`)).toMatchInlineSnapshot()`,
			`await expect(check()).rejects.toThrow()`,
		].map(code => ({ name: code, code: declarations + code })),
		{
			name: "any-typed subjects are not checked",
			code: `declare let loose: any; expect(loose).toMatchInlineSnapshot(); expect(\`\${loose}\`).toMatchInlineSnapshot()`,
		},
		{
			name: "compile-time type assertions",
			code: `import { expectTypeOf, assertType } from "vitest"; expectTypeOf(1).toEqualTypeOf<number>(); assertType<number>(1)`,
		},
		...[
			`function loaded<T>(value: T | null): T { if (!value) throw new Error("not loaded"); return value }`,
			`test("x", () => { let fail = () => { throw new Error("kaboom") } })`,
			`test("x", () => { function helper() { throw new Error("x") } })`,
			`describe("x", () => { function helper() { throw new Error("x") } })`,
		].map(code => ({ name: code, code })),
	],
	invalid: [
		...[
			`expect(1).toBe(1)`,
			`expect(1).toEqual(1)`,
			`expect(1).toSatisfy(value => value)`,
			`expect(1).toBeCorrect(1)`,
			`expect("a").toMatch(/a/)`,
			`expect.soft(1).toBe(1)`,
			`await expect.soft(p).resolves.toEqual(1)`,
			`await expect.poll(() => count).toBe(1)`,
			`await expect(p).rejects.toBeInstanceOf(Error)`,
			`expect(1).toBe.call(null, 1)`,
		].map(code => ({ code, errors: [{ messageId: "disallowedMatcher" }] })),
		{
			name: "expect imported under another name",
			code: `import { expect as check } from "vitest"; check(1).toBe(1)`,
			errors: [{ messageId: "disallowedMatcher" }],
		},
		...[
			`expect(() => run()).not.toThrow()`,
			`await expect(p).resolves.not.toThrow()`,
			`expect(1).not.toMatchInlineSnapshot()`,
		].map(code => ({ code, errors: [{ messageId: "negatedMatcher" }] })),
		...[
			`expect(1)`,
			`expect(1).not`,
			`let assertion = expect(1); assertion.toBe(1)`,
			`expect(1).toMatchInlineSnapshot`,
		].map(code => ({ code, errors: [{ messageId: "missingMatcher" }] })),
		...[
			`assert(value)`,
			`assert.equal(1, 1)`,
			`assert.deepStrictEqual(a, b)`,
		].map(code => ({ code, errors: [{ messageId: "assertStyle" }] })),
		...[
			`import assert from "assert"`,
			`import assert from "node:assert"`,
			`import { strict } from "node:assert"`,
			`import * as assert from "node:assert/strict"`,
			`import { assert } from "vitest"`,
			`import { assert as check } from "vitest"`,
			`import { assert } from "chai"`,
			`import { should } from "chai"`,
		].map(code => ({ code, errors: [{ messageId: "assertStyle" }] })),
		...[
			`expect(done).toMatchInlineSnapshot()`,
			`expect(flag).toMatchInlineSnapshot()`,
			`expect(isAdmin()).toMatchInlineSnapshot()`,
			`expect(count === 1).toMatchInlineSnapshot()`,
			`expect(items.some(item => item.id === name)).toMatchInlineSnapshot()`,
			`expect(!name).toMatchInlineSnapshot()`,
			`expect.soft(done).toMatchInlineSnapshot()`,
			`await expect(check()).resolves.toMatchInlineSnapshot()`,
		].map(code => ({
			name: code,
			code: declarations + code,
			errors: [{ messageId: "booleanSubject" }],
		})),
		...[
			`expect(\`\${done}\`).toMatchInlineSnapshot('"true"')`,
			`expect(\`admin: \${isAdmin()}\`).toMatchInlineSnapshot()`,
			`expect(\`\${count === 1}\`).toMatchInlineSnapshot()`,
			`expect({ same: \`\${done}\` }).toMatchInlineSnapshot()`,
			`expect([name, \`\${done}\`]).toMatchInlineSnapshot()`,
			`expect({ rows: [\`\${done}\`] }).toMatchInlineSnapshot()`,
			`expect([...[\`\${done}\`]]).toMatchInlineSnapshot()`,
		].map(code => ({
			name: code,
			code: declarations + code,
			errors: [{ messageId: "booleanInTemplate" }],
		})),
		{
			name: "each boolean in a template is reported",
			code:
				declarations +
				`expect(\`\${done} \${name} \${flag}\`).toMatchInlineSnapshot()`,
			errors: [
				{ messageId: "booleanInTemplate" },
				{ messageId: "booleanInTemplate" },
			],
		},
		{
			name: "every problem in one assertion is reported",
			code: declarations + `expect(count === 1).toBe(true)`,
			errors: [
				{ messageId: "disallowedMatcher" },
				{ messageId: "booleanSubject" },
			],
		},
		...[
			`test("x", () => { throw new Error("x") })`,
			`test("x", async () => { if (!value) throw new Error("x") })`,
			`it("x", function () { throw new Error("x") })`,
			`it.only("x", () => { throw new Error("x") })`,
			`test.each([1])("x %s", () => { throw new Error("x") })`,
			`test("x", () => { for (let item of items) { if (item) throw new Error("x") } })`,
			`beforeEach(() => { throw new Error("x") })`,
			`afterAll(async () => { throw new Error("x") })`,
		].map(code => ({
			name: code,
			code,
			errors: [{ messageId: "throwInTest" }],
		})),
	],
})
