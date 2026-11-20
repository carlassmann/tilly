// Polyfill navigator.language for test environment (used in UserAccount migration)
if (typeof navigator === "undefined") {
	// @ts-expect-error - polyfill for test environment
	globalThis.navigator = {
		language: "en-US",
	}
} else if (typeof navigator.language === "undefined") {
	Object.defineProperty(navigator, "language", {
		value: "en-US",
		configurable: true,
	})
}

// Setup Jazz test sync globally (must be called before any test account creation)
import { setupJazzTestSync } from "jazz-tools/testing"
await setupJazzTestSync()

// Backs up architecture/expect-tests-only at runtime: a snapshot of a bare
// boolean hides the values it was computed from (docs/testing.md). A
// serializer, not a matcher wrapper, because vitest finds the inline snapshot
// to write by counting stack frames from its own matcher.
import { expect } from "vitest"
expect.addSnapshotSerializer({
	test: value => typeof value === "boolean",
	serialize(value, _config, _indentation, depth) {
		if (depth === 0) {
			throw new Error(
				`Snapshotting a bare boolean (${value}) hides the values it was computed from. Snapshot the values themselves (docs/testing.md).`,
			)
		}
		return String(value)
	},
})
