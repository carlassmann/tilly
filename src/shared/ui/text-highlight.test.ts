import { expect, test } from "vitest"
import { extractSearchTerms } from "#shared/lib/search-terms"

test("extractSearchTerms", () => {
	let cases: [string, Parameters<typeof extractSearchTerms>][] = [
		["extracts hashtag and search term from combined query", ["#family mom"]],
		["extracts only search term when no hashtag", ["mom"]],
		["extracts only hashtag when no search term", ["#family"]],
		["handles hashtag with extra spaces", ["#family   mom"]],
		["handles multi-word search term", ["#work project manager"]],
		["returns empty array for empty query", [""]],
		["returns empty array for whitespace only", ["   "]],
		["handles hashtag with numbers", ["#family2023 reunion"]],
		["handles hashtag with underscores", ["#best_friends party"]],
		["only extracts first hashtag as filter", ["#family #friends mom"]],
		["handles case sensitivity in hashtag", ["#Family mom"]],
		["handles trailing whitespace", ["#family mom  "]],
		["handles leading whitespace", ["  #family mom"]],
		["trims search term properly", ["#work  project  "]],
	]
	let table = cases.map(
		([label, args]) =>
			`${label}: ${JSON.stringify(args)} -> ${JSON.stringify(extractSearchTerms(...args))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "extracts hashtag and search term from combined query: ["#family mom"] -> ["#family","mom"]",
		  "extracts only search term when no hashtag: ["mom"] -> ["mom"]",
		  "extracts only hashtag when no search term: ["#family"] -> ["#family"]",
		  "handles hashtag with extra spaces: ["#family   mom"] -> ["#family","mom"]",
		  "handles multi-word search term: ["#work project manager"] -> ["#work","project manager"]",
		  "returns empty array for empty query: [""] -> []",
		  "returns empty array for whitespace only: ["   "] -> []",
		  "handles hashtag with numbers: ["#family2023 reunion"] -> ["#family2023","reunion"]",
		  "handles hashtag with underscores: ["#best_friends party"] -> ["#best_friends","party"]",
		  "only extracts first hashtag as filter: ["#family #friends mom"] -> ["#family","#friends mom"]",
		  "handles case sensitivity in hashtag: ["#Family mom"] -> ["#Family","mom"]",
		  "handles trailing whitespace: ["#family mom  "] -> ["#family","mom"]",
		  "handles leading whitespace: ["  #family mom"] -> ["#family","mom"]",
		  "trims search term properly: ["#work  project  "] -> ["#work","project"]",
		]
	`)
})
