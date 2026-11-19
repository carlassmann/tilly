import { beforeEach, describe, expect, test } from "vitest"
import type { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { createAccount, seedPerson } from "#shared/tools/test-helpers"
import {
	normalizeHashtag,
	removeHashtagFromSummary,
	addHashtagToSummary,
	replaceHashtagInSummary,
	removeTagFromDeselectedPeople,
	addTagToNewlySelectedPeople,
	renameTagForRemainingPeople,
} from "./list-operations"

test("hashtag summary transformations", () => {
	let show = (value: string | undefined) => JSON.stringify(value) ?? "undefined"
	let call = <A extends (string | undefined)[]>(
		name: string,
		fn: (...args: A) => string,
		...args: A
	) => `${name}(${args.map(show).join(", ")}) → ${show(fn(...args))}`

	expect([
		call("normalize", normalizeHashtag, "Hello World!"),
		call("normalize", normalizeHashtag, "my_tag"),
		call("normalize", normalizeHashtag, ""),
		call("normalize", normalizeHashtag, "café-résumé"),
		call(
			"remove",
			removeHashtagFromSummary,
			"friend from work #colleague",
			"#colleague",
		),
		call("remove", removeHashtagFromSummary, "a #foo b", "#foo"),
		call("remove", removeHashtagFromSummary, "#only", "#only"),
		call("remove", removeHashtagFromSummary, undefined, "#tag"),
		call("remove", removeHashtagFromSummary, "hi #Friend", "#friend"),
		call("remove", removeHashtagFromSummary, "#friends forever", "#friend"),
		call("remove", removeHashtagFromSummary, "a  #tag  b", "#tag"),
		call("add", addHashtagToSummary, "old friend", "#colleague"),
		call("add", addHashtagToSummary, "", "#new"),
		call("add", addHashtagToSummary, undefined, "#new"),
		call("add", addHashtagToSummary, "  padded  ", "#tag"),
		call("replace", replaceHashtagInSummary, "my #old friend", "#old", "#new"),
		call("replace", replaceHashtagInSummary, undefined, "#old", "#new"),
		call("replace", replaceHashtagInSummary, "hi #OLD pal", "#old", "#new"),
		call("replace", replaceHashtagInSummary, "#oldfriend #old", "#old", "#new"),
		call("replace", replaceHashtagInSummary, "notes #old", "#old", "#new"),
	]).toMatchInlineSnapshot(`
		[
		  "normalize("Hello World!") → "#helloworld"",
		  "normalize("my_tag") → "#my_tag"",
		  "normalize("") → "#"",
		  "normalize("café-résumé") → "#cafrsum"",
		  "remove("friend from work #colleague", "#colleague") → "friend from work"",
		  "remove("a #foo b", "#foo") → "a b"",
		  "remove("#only", "#only") → """,
		  "remove(undefined, "#tag") → """,
		  "remove("hi #Friend", "#friend") → "hi"",
		  "remove("#friends forever", "#friend") → "#friends forever"",
		  "remove("a  #tag  b", "#tag") → "a b"",
		  "add("old friend", "#colleague") → "old friend #colleague"",
		  "add("", "#new") → "#new"",
		  "add(undefined, "#new") → "#new"",
		  "add("  padded  ", "#tag") → "padded #tag"",
		  "replace("my #old friend", "#old", "#new") → "my #new friend"",
		  "replace(undefined, "#old", "#new") → """,
		  "replace("hi #OLD pal", "#old", "#new") → "hi #new pal"",
		  "replace("#oldfriend #old", "#old", "#new") → "#oldfriend #new"",
		  "replace("notes #old", "#old", "#new") → "notes #new"",
		]
	`)
})

describe("bulk tag operations", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	test("removeTagFromDeselectedPeople strips tag from unselected people", async () => {
		let alice = await seedPerson(owner, {
			name: "Alice",
			summary: "friend #team",
		})
		let bob = await seedPerson(owner, {
			name: "Bob",
			summary: "colleague #team",
		})

		let selectedPeople = new Set([alice.$jazz.id])

		await removeTagFromDeselectedPeople({
			oldTag: "#team",
			selectedPeople,
			peopleInList: [
				{
					$jazz: { id: alice.$jazz.id },
					name: "Alice",
					summary: "friend #team",
				},
				{
					$jazz: { id: bob.$jazz.id },
					name: "Bob",
					summary: "colleague #team",
				},
			],
			me: owner,
		})

		let reloaded = await bob.$jazz.ensureLoaded({ resolve: {} })
		expect(reloaded.summary).toBe("colleague")
	})

	test("addTagToNewlySelectedPeople adds tag only to newly selected", async () => {
		let alice = await seedPerson(owner, { name: "Alice", summary: "friend" })
		let bob = await seedPerson(owner, {
			name: "Bob",
			summary: "colleague #old",
		})

		let initialSelected = new Set([bob.$jazz.id])
		let selectedPeople = new Set([alice.$jazz.id, bob.$jazz.id])

		await addTagToNewlySelectedPeople({
			oldTag: "#old",
			newTag: "#new",
			selectedPeople,
			initialSelectedPeople: initialSelected,
			allPeople: [
				{ $jazz: { id: alice.$jazz.id }, name: "Alice", summary: "friend" },
				{ $jazz: { id: bob.$jazz.id }, name: "Bob", summary: "colleague #old" },
			],
			me: owner,
		})

		let reloadedAlice = await alice.$jazz.ensureLoaded({ resolve: {} })
		expect(reloadedAlice.summary).toBe("friend #new")

		let reloadedBob = await bob.$jazz.ensureLoaded({ resolve: {} })
		expect(reloadedBob.summary).toBe("colleague #old")
	})

	test("renameTagForRemainingPeople renames tag for selected people", async () => {
		let alice = await seedPerson(owner, {
			name: "Alice",
			summary: "friend #old",
		})

		await renameTagForRemainingPeople({
			oldTag: "#old",
			newTag: "#new",
			selectedPeople: new Set([alice.$jazz.id]),
			peopleInList: [
				{
					$jazz: { id: alice.$jazz.id },
					name: "Alice",
					summary: "friend #old",
				},
			],
			me: owner,
		})

		let reloaded = await alice.$jazz.ensureLoaded({ resolve: {} })
		expect(reloaded.summary).toBe("friend #new")
	})
})
