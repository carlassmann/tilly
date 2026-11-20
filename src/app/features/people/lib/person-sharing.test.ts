import { beforeEach, describe, expect, test } from "vitest"
import { setActiveAccount } from "jazz-tools/testing"
import { co } from "jazz-tools"
import { Note, Person, Reminder, UserAccount } from "#shared/schema/user"
import {
	acceptPersonInvite,
	createPersonInviteLink,
	getInviteGroupsWithMembers,
	getPendingInviteGroups,
	isGroupOwned,
	removeInviteGroup,
} from "./person-sharing"
import { parseInviteHash } from "./invite"
import {
	createAccount,
	redactNoise,
	seedPerson,
} from "#shared/tools/test-helpers"
import { updatePerson } from "#shared/tools/person-update"

let BASE_URL = "http://test.invalid/app/invite"

async function loadFullPerson(person: co.loaded<typeof Person>) {
	let loaded = await Person.load(person.$jazz.id, {
		resolve: {
			notes: { $each: { $onError: "catch" } },
			reminders: { $each: { $onError: "catch" } },
			inactiveNotes: { $each: { $onError: "catch" } },
			inactiveReminders: { $each: { $onError: "catch" } },
		},
	})
	if (!loaded?.$isLoaded) throw new Error("Failed to load full person")
	return loaded
}

function parseInviteLink(link: string) {
	let hashIdx = link.indexOf("#")
	if (hashIdx === -1) throw new Error("No hash in invite link")
	let data = parseInviteHash(link.slice(hashIdx))
	if (!data) throw new Error("Invalid invite link")
	return data
}

describe("Person sharing", () => {
	let owner: co.loaded<typeof UserAccount>

	beforeEach(async () => {
		owner = await createAccount({ isCurrentActive: true })
	})

	async function createInvite(person: co.loaded<typeof Person>) {
		let full = await loadFullPerson(person)
		return parseInviteLink(
			await createPersonInviteLink(full, owner.$jazz.id, BASE_URL),
		)
	}

	async function signUpInvitee() {
		await owner.$jazz.waitForAllCoValuesSync()
		let invitee = await createAccount()
		setActiveAccount(invitee)
		let loadedInvitee = await invitee.$jazz.ensureLoaded({
			resolve: { root: { people: true } },
		})
		return { invitee, loadedInvitee }
	}

	async function loadInviteePeople(invitee: co.loaded<typeof UserAccount>) {
		let { root } = await invitee.$jazz.ensureLoaded({
			resolve: { root: { people: { $each: true } } },
		})
		return root.people
	}

	describe("createPersonInviteLink", () => {
		test("emits the canonical invite URL format", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let full = await loadFullPerson(person)

			let link = await createPersonInviteLink(full, owner.$jazz.id, BASE_URL)
			let [personId, ...path] = redactNoise([
				person.$jazz.id,
				...link.replace(/inviteSecret_\w+/, "inviteSecret_<secret>").split("/"),
			])
			expect(`person ${personId}: ${path.join("/")}`).toMatchInlineSnapshot(
				`"person <id:1>: http://test.invalid/app/invite#/person/<id:1>/invite/<id:2>/inviteSecret_<secret>"`,
			)
		})

		test("parsed invite resolves to the original personId", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let parsed = await createInvite(person)
			expect(
				redactNoise({ original: person.$jazz.id, parsed: parsed.personId }),
			).toMatchInlineSnapshot(`
				{
				  "original": "<id:1>",
				  "parsed": "<id:1>",
				}
			`)
		})
	})

	describe("acceptPersonInvite", () => {
		test("invitee gains access and the person is pushed to their root.people", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let parsed = await createInvite(person)
			let { invitee, loadedInvitee } = await signUpInvitee()

			let result = await acceptPersonInvite(loadedInvitee, parsed)
			let people = await loadInviteePeople(invitee)
			expect(
				redactNoise({
					status: result.status,
					shared: person.$jazz.id,
					inviteePeople: people.map(p => p?.$jazz.id),
				}),
			).toMatchInlineSnapshot(`
				{
				  "inviteePeople": [
				    "<id:1>",
				  ],
				  "shared": "<id:1>",
				  "status": "accepted",
				}
			`)
		})

		test("invitee can edit the shared person (writer role grants write access)", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let parsed = await createInvite(person)
			let { invitee, loadedInvitee } = await signUpInvitee()
			await acceptPersonInvite(loadedInvitee, parsed)

			await updatePerson(invitee, {
				personId: person.$jazz.id,
				name: "Ada by invitee",
			})
			await invitee.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let reloaded = await Person.load(person.$jazz.id)
			expect(reloaded?.$isLoaded ? reloaded.name : null).toMatchInlineSnapshot(
				`"Ada by invitee"`,
			)
		})

		test("accepting twice is idempotent (already-member, no duplicate in list)", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let parsed = await createInvite(person)
			let { invitee, loadedInvitee } = await signUpInvitee()

			let first = await acceptPersonInvite(loadedInvitee, parsed)
			let second = await acceptPersonInvite(loadedInvitee, parsed)

			let people = await loadInviteePeople(invitee)
			expect(
				redactNoise({
					statuses: [first.status, second.status],
					shared: person.$jazz.id,
					inviteePeople: people.map(p => p?.$jazz.id),
				}),
			).toMatchInlineSnapshot(`
				{
				  "inviteePeople": [
				    "<id:1>",
				  ],
				  "shared": "<id:1>",
				  "statuses": [
				    "accepted",
				    "already-member",
				  ],
				}
			`)
		})
	})

	describe("revocation", () => {
		test("revoked invitee loses read access to the person", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let parsed = await createInvite(person)
			let { invitee, loadedInvitee } = await signUpInvitee()
			await acceptPersonInvite(loadedInvitee, parsed)

			let visibleBefore = await Person.load(person.$jazz.id)

			setActiveAccount(owner)
			removeInviteGroup(
				person,
				parsed.inviteGroupId as Parameters<typeof removeInviteGroup>[1],
			)
			await owner.$jazz.waitForAllCoValuesSync()

			setActiveAccount(invitee)
			let visibleAfter = await Person.load(person.$jazz.id)
			expect(
				`${visibleBefore?.$jazz.loadingState} -> ${visibleAfter?.$jazz.loadingState}`,
			).toMatchInlineSnapshot(`"loaded -> unauthorized"`)
		})
	})

	describe("getInviteGroupsWithMembers / getPendingInviteGroups", () => {
		test("pending groups show accepted-but-empty invites; members appear after acceptance", async () => {
			let person = await seedPerson(owner, { name: "Ada" })
			let parsed = await createInvite(person)

			let pendingBefore = getPendingInviteGroups(person)
			let withMembersBefore = await getInviteGroupsWithMembers(person)

			let { invitee, loadedInvitee } = await signUpInvitee()
			await acceptPersonInvite(loadedInvitee, parsed)
			await invitee.$jazz.waitForAllCoValuesSync()

			setActiveAccount(owner)
			let reloadedPerson = await Person.load(person.$jazz.id)
			if (!reloadedPerson?.$isLoaded) throw new Error("person gone")
			let withMembersAfter = await getInviteGroupsWithMembers(reloadedPerson)
			expect(
				redactNoise({
					inviteGroup: parsed.inviteGroupId,
					invitee: invitee.$jazz.id,
					pendingBefore: pendingBefore.map(p => p.groupId),
					withMembersBefore,
					withMembersAfter,
				}),
			).toMatchInlineSnapshot(`
				{
				  "inviteGroup": "<id:1>",
				  "invitee": "<id:2>",
				  "pendingBefore": [
				    "<id:1>",
				  ],
				  "withMembersAfter": [
				    {
				      "createdAt": "<time>",
				      "groupId": "<id:1>",
				      "members": [
				        {
				          "id": "<id:2>",
				          "inviteGroupId": "<id:1>",
				          "name": "Anonymous",
				          "role": "writer",
				        },
				      ],
				    },
				  ],
				  "withMembersBefore": [],
				}
			`)
		})
	})

	describe("legacy account-owned migration", () => {
		async function seedAccountOwnedPerson(
			account: co.loaded<typeof UserAccount>,
			name: string,
		) {
			let { root } = await account.$jazz.ensureLoaded({
				resolve: { root: { people: true } },
			})
			let now = new Date()
			let person = Person.create(
				{
					version: 1,
					name,
					notes: co.list(Note).create([], account),
					reminders: co.list(Reminder).create([], account),
					createdAt: now,
					updatedAt: now,
				},
				account,
			)
			root.people.$jazz.push(person)
			return person
		}

		test("isGroupOwned is true only for group-owned persons", async () => {
			let accountOwned = await seedAccountOwnedPerson(owner, "Legacy")
			let groupOwned = await seedPerson(owner, { name: "Modern" })
			expect(
				`account-owned: ${isGroupOwned(await loadFullPerson(accountOwned))}, group-owned: ${isGroupOwned(await loadFullPerson(groupOwned))}`,
			).toMatchInlineSnapshot(`"account-owned: false, group-owned: true"`)
		})

		test("inviting an account-owned person migrates it and yields a working link", async () => {
			let original = await seedAccountOwnedPerson(owner, "Legacy")
			let parsed = await createInvite(original)
			let migrated = await Person.load(parsed.personId)
			if (!migrated?.$isLoaded) throw new Error("migrated person not loaded")

			let { loadedInvitee } = await signUpInvitee()
			let result = await acceptPersonInvite(loadedInvitee, parsed)
			expect({
				...redactNoise({
					original: original.$jazz.id,
					invited: parsed.personId,
				}),
				name: migrated.name,
				groupOwned: isGroupOwned(migrated),
				status: result.status,
			}).toMatchInlineSnapshot(`
				{
				  "groupOwned": true,
				  "invited": "<id:2>",
				  "name": "Legacy",
				  "original": "<id:1>",
				  "status": "accepted",
				}
			`)
		})
	})
})
