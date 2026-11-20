import { typedRuleTester } from "../rule-tester.js"
import rule from "../../rules/expect-tests-no-booleans.js"

// Declarations give the subjects real types; undeclared names are `any`.
let declarations = `
declare let done: boolean
declare let flag: true
declare let maybe: boolean | undefined
declare let count: number
declare let name: string
declare let items: { id: string; done: boolean }[]
declare let flags: boolean[]
declare function isAdmin(): boolean
declare function check(): Promise<boolean>
`

function withDeclarations(code: string) {
	return { name: code, code: declarations + code }
}

function invalid(messageId: string, codes: string[]) {
	return codes.map(code => ({
		...withDeclarations(code),
		errors: [{ messageId }],
	}))
}

typedRuleTester.run("expect-tests-no-booleans", rule, {
	valid: [
		...[
			`expect(summary).toMatchInlineSnapshot()`,
			`expect(\`\${now} -> \${wasDeliveredToday(now)}\`).toMatchInlineSnapshot()`,
			`let table = items.filter(item => item.done === true); expect(table).toMatchInlineSnapshot()`,
			`expect(items.filter(item => item.done === true)).toMatchInlineSnapshot()`,
			`expect({ done, count }).toMatchInlineSnapshot()`,
			`expect({ done: String(done), shown: done ? "yes" : "no" }).toMatchInlineSnapshot()`,
			`expect([done, name]).toMatchInlineSnapshot()`,
			`expect(items).toMatchInlineSnapshot()`,
			`expect(maybe).toMatchInlineSnapshot()`,
			`expect(\`\${name}: \${count}\`).toMatchInlineSnapshot()`,
			`expect(String(count)).toMatchInlineSnapshot()`,
			`expect(count > 1 ? name : "none").toMatchInlineSnapshot()`,
			`expect(count.toString()).toMatchInlineSnapshot()`,
			`let table = items.map(item => \`\${item.id} -> \${item.done}\`); expect(table).toMatchInlineSnapshot()`,
			`expect(items.map(item => \`\${item.id} -> \${item.done}\`)).toMatchInlineSnapshot()`,
			`await expect(check()).rejects.toThrow()`,
			`await expect.poll(() => count).toMatchInlineSnapshot()`,
			`expect([]).toMatchInlineSnapshot()`,
		].map(withDeclarations),
		{
			name: "any-typed subjects are not checked",
			code: `declare let loose: any; expect(loose).toMatchInlineSnapshot(); expect(\`\${loose}\`).toMatchInlineSnapshot()`,
		},
	],
	invalid: [
		...invalid("booleanSubject", [
			`expect(done).toMatchInlineSnapshot()`,
			`expect(flag).toMatchInlineSnapshot()`,
			`expect(isAdmin()).toMatchInlineSnapshot()`,
			`expect(count === 1).toMatchInlineSnapshot()`,
			`expect(items.some(item => item.id === name)).toMatchInlineSnapshot()`,
			`expect(!name).toMatchInlineSnapshot()`,
			`expect.soft(done).toMatchInlineSnapshot()`,
			`await expect(check()).resolves.toMatchInlineSnapshot()`,
			`await expect.poll(() => count === 1).toMatchInlineSnapshot()`,
			`await expect.poll(check).toMatchInlineSnapshot()`,
			`import { expect as snap } from "vitest"; snap(done).toMatchInlineSnapshot()`,
		]),
		...invalid("booleanArray", [
			`expect([done]).toMatchInlineSnapshot()`,
			`expect([done, count === 1]).toMatchInlineSnapshot()`,
			`expect(flags).toMatchInlineSnapshot()`,
			`expect(items.map(item => item.done)).toMatchInlineSnapshot()`,
		]),
		...invalid("convertedBoolean", [
			`expect(String(done)).toMatchInlineSnapshot()`,
			`expect(Number(count === 1)).toMatchInlineSnapshot()`,
			`expect(JSON.stringify(done)).toMatchInlineSnapshot()`,
			`expect(JSON.stringify(flags)).toMatchInlineSnapshot()`,
			`expect(done.toString()).toMatchInlineSnapshot()`,
			`expect((count === 1).toString()).toMatchInlineSnapshot()`,
			`expect(done ? "yes" : "no").toMatchInlineSnapshot()`,
			`expect(count === 1 ? 1 : 0).toMatchInlineSnapshot()`,
			`expect(done ? \`yes\` : \`no\`).toMatchInlineSnapshot()`,
			`expect(+done).toMatchInlineSnapshot()`,
			`expect(done + "").toMatchInlineSnapshot()`,
			`expect([name, String(done)]).toMatchInlineSnapshot()`,
		]),
		...invalid("booleanInTemplate", [
			`expect(\`\${done}\`).toMatchInlineSnapshot('"true"')`,
			`expect(\`admin: \${isAdmin()}\`).toMatchInlineSnapshot()`,
			`expect(\`\${count === 1}\`).toMatchInlineSnapshot()`,
			`expect({ same: \`\${done}\` }).toMatchInlineSnapshot()`,
			`expect([name, \`\${done}\`]).toMatchInlineSnapshot()`,
			`expect({ rows: [\`\${done}\`] }).toMatchInlineSnapshot()`,
			`expect([...[\`\${done}\`]]).toMatchInlineSnapshot()`,
		]),
		...invalid("boxedBoolean", [
			`expect(new Boolean(done)).toMatchInlineSnapshot()`,
			`let boxed = new Boolean(count === 1)`,
		]),
		{
			...withDeclarations(
				`expect(\`\${done} \${name} \${flag}\`).toMatchInlineSnapshot()`,
			),
			errors: [
				{ messageId: "booleanInTemplate" },
				{ messageId: "booleanInTemplate" },
			],
		},
	],
})
