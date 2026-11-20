# Testing

Unit tests in `src/` (`*.test.ts(x)` and `*.spec.ts(x)`) and their shared helpers (`src/**/test-helpers.ts`, `test-stubs/`) are expect tests: the code produces the output, you review it once, `toMatchInlineSnapshot` locks it in. Hand-written expected values are banned by ESLint: `architecture/expect-tests-only` (all of `src/`) and `architecture/expect-tests-no-booleans` (test files and helpers, type-aware). Only those files may import `vitest` or use its globals.

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

## What the rules allow

Every `expect(...)`, `expect.soft(...)` and `expect.poll(...)` chain must end in one of:

- `toMatchInlineSnapshot`, with no argument or the snapshot text vitest wrote: a string or template literal without `${}`. No property matchers.
- `toThrow`, `toThrowError`, `toThrowErrorMatchingInlineSnapshot` (also after `rejects.` / `resolves.`)

Every test must assert at least once (`expect.requireAssertions` in `vitest.config.ts`): an empty test or one that returns before its snapshot fails. Type-only tests with `expectTypeOf` / `assertType` go in `*.test-d.ts`: vitest typechecks them and never runs them.

Also reported:

- any other matcher, including `toSatisfy`, `toMatch`, `toMatchSnapshot` and custom matchers
- `.not.` matchers, including `not.toThrow`: snapshot the result instead
- `expect` used other than as `expect(...)`, `expect.soft(...)`, `expect.poll(...)`, `expect.hasAssertions()` or `expect.assertions(<n > 0>)`: aliases (`let check = expect`, `{ check: expect }`), `expect.call/bind/apply`, asymmetric matchers like `expect.any`, and the test context's `expect` (`({ expect }) =>`, `ctx.expect`)
- `expect.extend`, `expect.addSnapshotSerializer`, `expect.addEqualityTesters`: these belong in `vitest.setup.ts`
- `assert`, `should`, `chai` and `createExpect` from `vitest`, its globals `assert` and `chai`, any import of `chai`, `@vitest/expect` or `node:assert`, namespace or dynamic imports of `vitest`, re-exports of these modules, and dynamic imports with a computed module name
- a subject whose TypeScript type is boolean (`boolean`, `true`, `false`), e.g. `expect(a === b)` or `expect(list.includes(x))`: the snapshot `true` hides the values. Snapshot the values themselves. Booleans as fields are fine: `expect({ done, dueAtDate })`.
- a list of booleans, or a boolean converted in the subject: `String(b)`, `Number(b)`, `JSON.stringify(b)`, `b.toString()`, `b ? "yes" : "no"`, `+b`, `b + ""`
- a boolean interpolated into a template string written in the subject, also inside object or array literals there: ``expect(`${a === b}`)``. A table built before the `expect` (see above) is fine, since each row shows its inputs.
- `new Boolean(...)` in test files
- `throw` directly in a `test`/`it` callback or a `beforeEach`/`afterEach`/`beforeAll`/`afterAll` hook: `if (x !== y) throw` is a hand-written assertion. Throws inside helper functions and stubs are allowed; use them to narrow types in setup, e.g. `requireLoaded(await Person.load(id), "person")` from `#shared/tools/test-helpers`.

The boolean checks use type information, so values typed `any` are not checked. Type-aware linting runs only for test files and helpers.

Also checked at runtime: `vitest.setup.ts` fails `toMatchInlineSnapshot` and `toMatchSnapshot` when the received value is a bare boolean, boxed or not, including after `resolves.`. This also catches what the lint rule cannot see, e.g. an `any`-typed subject.

## Exceptions: must-hold rules

A rule that must always hold, where a snapshot hides the intent, may use a plain matcher with a reason:

```ts
// eslint-disable-next-line architecture/expect-tests-only -- invariant: deleted notes never reach the AI
expect(result.notes).not.toContainEqual(deletedNote)
```

The same works for `architecture/expect-tests-no-booleans`. The `-- invariant: <why>` description is required. Only `eslint-disable-next-line` and `eslint-disable-line` may opt out; block or file-wide `eslint-disable`, disables without a rule list and inline `/* eslint ... */` config of the rule are errors that no directive can suppress. Keep these rare.

## Out of scope

- Tests under `tools/`, e.g. the `tools/eslint-plugin-architecture` rule tests (`RuleTester` tables)
- Playwright e2e tests in `e2e/`
