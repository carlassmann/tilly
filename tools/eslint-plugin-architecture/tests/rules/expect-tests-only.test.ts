import { ruleTester } from "../rule-tester.js"
import rule from "../../rules/expect-tests-only.js"

ruleTester.run("expect-tests-only", rule, {
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
			`expect(a === b).toMatchInlineSnapshot()`,
			`expect(a !== b).toMatchInlineSnapshot()`,
			`expect(a == b).toMatchInlineSnapshot()`,
			`expect(a != b).toMatchInlineSnapshot()`,
			`expect(a < b).toMatchInlineSnapshot()`,
			`expect(a > b).toMatchInlineSnapshot()`,
			`expect(a <= b).toMatchInlineSnapshot()`,
			`expect(a >= b).toMatchInlineSnapshot()`,
			`expect(\`\${a === b}\`).toMatchInlineSnapshot('"true"')`,
			`expect({ same: a === b }).toMatchInlineSnapshot()`,
			`expect(items.some(item => item.id === id)).toMatchInlineSnapshot()`,
			`expect.soft(a === b).toMatchInlineSnapshot()`,
		].map(code => ({ code, errors: [{ messageId: "comparisonInSubject" }] })),
		{
			name: "every problem in one assertion is reported",
			code: `expect(a === b).toBe(true)`,
			errors: [
				{ messageId: "disallowedMatcher" },
				{ messageId: "comparisonInSubject" },
			],
		},
	],
})
