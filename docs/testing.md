# Testing

Unit tests in `src/` (`*.test.ts(x)` and `*.spec.ts(x)`) are expect tests: the code produces the output, you review it once, `toMatchInlineSnapshot` locks it in. Hand-written expected values are banned by ESLint (`architecture/expect-tests-only`).

## Writing one

1. Write `expect(summary).toMatchInlineSnapshot()` with no argument.
2. Run `bunx vitest run -u <file>`. Vitest fills in the snapshot.
3. Read the generated value. Commit only if it is right.

In CI, an empty or outdated snapshot fails instead of being written.

## Snapshot readable output

- Many cases of one function: a table, one line per case.

```ts
let table = cases.map(
	([now, delivered]) =>
		`${now} | ${delivered} -> ${wasDeliveredToday(settings, now)}`,
)
expect(table).toMatchInlineSnapshot()
```

- State: one compact string per item, e.g. `"pinned-1 · Ada · pinned"`, or `{ active: [...], inactive: [...] }`.
- AI tools: one full-payload snapshot per tool file (what the model sees). Wrap it in `redactNoise` from `#shared/tools/test-helpers` so ids and timestamps don't change every run. Other tests snapshot only the part they are about.

## What the rule allows

Every `expect(...)`, `expect.soft(...)` and `expect.poll(...)` chain must end in one of:

- `toMatchInlineSnapshot`
- `toThrow`, `toThrowError`, `toThrowErrorMatchingInlineSnapshot` (also after `rejects.` / `resolves.`)

Also reported:

- any other matcher, including `toSatisfy`, `toMatch` and custom matchers
- `.not.` matchers, including `not.toThrow`: snapshot the result instead
- `assert` from `vitest`, `chai` or `node:assert`, and `assert(...)` / `assert.*(...)` calls
- comparisons (`===`, `<`, ...) inside `expect(...)`, even in a template string: ``expect(`${a === b}`)`` snapshots `"true"` and hides the values. Snapshot the values themselves.

## Exceptions: must-hold rules

A rule that must always hold, where a snapshot hides the intent, may use a plain matcher with a reason:

```ts
// eslint-disable-next-line architecture/expect-tests-only -- invariant: deleted notes never reach the AI
expect(result.notes).not.toContainEqual(deletedNote)
```

The `-- invariant: <why>` description is required. Only `eslint-disable-next-line` and `eslint-disable-line` may opt out; block or file-wide `eslint-disable`, disables without a rule list and inline `/* eslint ... */` config of the rule are errors that no directive can suppress. Keep these rare.

## Out of scope

- Tests under `tools/`, e.g. the `tools/eslint-plugin-architecture` rule tests (`RuleTester` tables)
- Playwright e2e tests in `e2e/`
