# Testing

Unit tests in `src/` are expect tests: the code produces the output, you review it once, `toMatchInlineSnapshot` locks it in. Hand-written expected values are banned by ESLint (`vitest/no-restricted-matchers`).

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

## Exceptions: must-hold rules

Thrown errors use `toThrow` / `rejects.toThrow` (allowed).

A rule that must always hold, where a snapshot hides the intent, may use a plain matcher with a reason:

```ts
// eslint-disable-next-line vitest/no-restricted-matchers -- invariant: deleted notes never reach the AI
expect(result.notes).not.toContainEqual(deletedNote)
```

The description is required. Keep these rare.

## Out of scope

- `tools/eslint-plugin-architecture` rule tests (`RuleTester` tables)
- Playwright e2e tests in `e2e/`
