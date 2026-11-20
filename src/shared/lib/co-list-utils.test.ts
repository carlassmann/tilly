import { describe, expect, test } from "vitest"
import {
	getLoadedCoListValues,
	removeCoListRefsById,
	removeCoValueRefsByLoadingStates,
	removeDeletedCoValueRefs,
} from "./co-list-utils"

type MockRef =
	| {
			name?: string
			$isLoaded?: boolean
			$jazz?: { id?: string; loadingState?: string }
	  }
	| null
	| undefined

function createMockCoList(items: MockRef[]) {
	let list = Object.assign([...items], {
		$jazz: {
			splice(start: number, deleteCount: number) {
				list.splice(start, deleteCount)
			},
		},
		values() {
			return list[Symbol.iterator]()
		},
	})
	return list
}

let loaded = (name: string) => ({ $isLoaded: true, name })
let unloaded = (loadingState: string) => ({
	$isLoaded: false,
	$jazz: { loadingState },
})
let withId = (id: string) => ({ $jazz: { id } })

function summarizeRefs(refs: MockRef[]) {
	let summaries = refs.map(ref => {
		if (!ref) return "null"
		if (ref.name) return ref.name
		if (ref.$jazz?.id) return ref.$jazz.id
		return `${ref.$isLoaded ? "loaded" : "unloaded"}: ${ref.$jazz?.loadingState}`
	})
	return summaries.join(" | ")
}

describe("getLoadedCoListValues", () => {
	test("returns only loaded values", () => {
		let list = createMockCoList([
			loaded("a"),
			{ $isLoaded: false, name: "b" },
			null,
			loaded("c"),
		])
		let result = getLoadedCoListValues<{ $isLoaded: boolean; name: string }>(
			list,
		)
		expect(result.map(r => r.name).join(", ")).toMatchInlineSnapshot(`"a, c"`)
	})

	test("returns empty array for non-list input", () => {
		let results = [null, "string", 42].map(input =>
			getLoadedCoListValues(input),
		)
		expect(JSON.stringify(results)).toMatchInlineSnapshot(`"[[],[],[]]"`)
	})

	test("returns empty array for list with all null values", () => {
		let list = createMockCoList([null, null, undefined])
		expect(getLoadedCoListValues(list)).toMatchInlineSnapshot(`[]`)
	})
})

describe("removeDeletedCoValueRefs", () => {
	test("removes only refs with 'deleted' loading state", () => {
		let list = createMockCoList([
			loaded("keep"),
			unloaded("deleted"),
			unloaded("loading"),
			unloaded("unavailable"),
		])
		removeDeletedCoValueRefs(list)
		expect(summarizeRefs(list)).toMatchInlineSnapshot(
			`"keep | unloaded: loading | unloaded: unavailable"`,
		)
	})

	test("handles empty list", () => {
		let list = createMockCoList([])
		removeDeletedCoValueRefs(list)
		expect(summarizeRefs(list)).toMatchInlineSnapshot(`""`)
	})
})

describe("removeCoValueRefsByLoadingStates", () => {
	test("removes unloaded refs matching any of the given states", () => {
		let list = createMockCoList([
			unloaded("deleted"),
			loaded("loaded"),
			{ $isLoaded: true, $jazz: { loadingState: "deleted" } },
			null,
			unloaded("unavailable"),
			unloaded("loading"),
		])
		removeCoValueRefsByLoadingStates(list, ["deleted", "unavailable"])
		expect(summarizeRefs(list)).toMatchInlineSnapshot(
			`"loaded | loaded: deleted | null | unloaded: loading"`,
		)
	})

	test("is a no-op on non-list input", () => {
		let plainArray: MockRef[] = [unloaded("deleted")]
		let notAList = {}
		removeCoValueRefsByLoadingStates(null, ["deleted"])
		removeCoValueRefsByLoadingStates(plainArray, ["deleted"])
		removeCoValueRefsByLoadingStates(notAList, ["deleted"])
		expect({
			plainArray: summarizeRefs(plainArray),
			notAList,
		}).toMatchInlineSnapshot(`
			{
			  "notAList": {},
			  "plainArray": "unloaded: deleted",
			}
		`)
	})
})

describe("removeCoListRefsById", () => {
	test("removes all refs matching the given id, skipping nulls", () => {
		let list = createMockCoList([
			withId("co_a"),
			null,
			withId("co_b"),
			withId("co_a"),
		])
		removeCoListRefsById(list, "co_a")
		expect(summarizeRefs(list)).toMatchInlineSnapshot(`"null | co_b"`)
	})

	test("is a no-op when id not found", () => {
		let list = createMockCoList([withId("co_b")])
		removeCoListRefsById(list, "co_a")
		expect(summarizeRefs(list)).toMatchInlineSnapshot(`"co_b"`)
	})
})
