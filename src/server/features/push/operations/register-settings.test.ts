import { beforeEach, describe, test, expect } from "vitest"
import {
	createJazzTestAccount,
	runWithoutActiveAccount,
	setupJazzTestSync,
	setActiveAccount,
} from "jazz-tools/testing"
import { Group, co } from "jazz-tools"
import { NotificationSettings } from "#shared/schema/user"
import { ServerAccount, ServerAccountRoot } from "#shared/schema/server"
import { registerNotificationSettingsWithServer } from "./register-settings"

describe("registerNotificationSettingsWithServer", () => {
	let serverAccount: co.loaded<typeof ServerAccount>
	let userAccount: co.loaded<typeof ServerAccount>

	beforeEach(async () => {
		await setupJazzTestSync()

		serverAccount = await createJazzTestAccount({
			isCurrentActiveAccount: true,
			AccountSchema: ServerAccount,
		})

		// Initialize server root manually since test accounts may not run migrations
		if (!serverAccount.root) {
			serverAccount.$jazz.set("root", ServerAccountRoot.create({}))
		}

		userAccount = await createJazzTestAccount({
			AccountSchema: ServerAccount,
		})
	})

	test("registers new notification settings", async () => {
		setActiveAccount(userAccount)

		let group = Group.create()
		group.addMember(serverAccount, "writer")

		let notificationSettings = NotificationSettings.create(
			{
				version: 1,
				timezone: "UTC",
				notificationTime: "09:00",
				pushDevices: [],
			},
			{ owner: group },
		)

		await userAccount.$jazz.waitForAllCoValuesSync()
		await serverAccount.$jazz.waitForAllCoValuesSync()

		setActiveAccount(serverAccount)

		let result = await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)

		let settingsId = notificationSettings.$jazz.id
		let refs = await loadRefs(serverAccount)
		let refLines = Object.entries(refs ?? {}).map(([key, ref]) =>
			[key, ref?.notificationSettings?.$jazz.id, ref?.userId]
				.join(" -> ")
				.replaceAll(settingsId, "<settingsId>"),
		)
		expect({ ok: result.isOk(), refLines }).toMatchInlineSnapshot(`
			{
			  "ok": true,
			  "refLines": [
			    "<settingsId> -> <settingsId> -> test-user-123",
			  ],
			}
		`)
	})

	test("updates lastSyncedAt for existing registration", async () => {
		setActiveAccount(userAccount)

		let group = Group.create()
		group.addMember(serverAccount, "writer")

		let notificationSettings = NotificationSettings.create(
			{
				version: 1,
				timezone: "UTC",
				notificationTime: "09:00",
				pushDevices: [],
			},
			{ owner: group },
		)

		await userAccount.$jazz.waitForAllCoValuesSync()
		await serverAccount.$jazz.waitForAllCoValuesSync()

		setActiveAccount(serverAccount)

		let firstResult = await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)
		let refs = await loadRefs(serverAccount)
		let firstSyncTime = refs?.[notificationSettings.$jazz.id]?.lastSyncedAt

		await new Promise(r => setTimeout(r, 10))

		await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)

		refs = await loadRefs(serverAccount)
		let secondSyncTime = refs?.[notificationSettings.$jazz.id]?.lastSyncedAt
		expect({
			firstOk: firstResult.isOk(),
			refCount: Object.keys(refs ?? {}).length,
			lastSyncedAtAdvanced: secondSyncTime! > firstSyncTime!,
		}).toMatchInlineSnapshot(`
			{
			  "firstOk": true,
			  "lastSyncedAtAdvanced": true,
			  "refCount": 1,
			}
		`)
	})

	test("returns error when server cannot access settings", async () => {
		setActiveAccount(userAccount)

		let notificationSettings = NotificationSettings.create({
			version: 1,
			timezone: "UTC",
			notificationTime: "09:00",
			pushDevices: [],
		})

		await userAccount.$jazz.waitForAllCoValuesSync()

		setActiveAccount(serverAccount)

		let result = await registerNotificationSettingsWithServer(
			serverAccount,
			notificationSettings.$jazz.id,
			"test-user-123",
		)

		let summary = result.match({
			ok: () => "ok",
			err: e => `${e._tag}: ${e.message}`,
		})
		expect(summary).toMatchInlineSnapshot(
			`"NotFound: Failed to load notification settings - ensure server has access"`,
		)
	})

	test("can register without active account context", async () => {
		setActiveAccount(userAccount)

		let group = Group.create()
		group.addMember(serverAccount, "writer")

		let notificationSettings = NotificationSettings.create(
			{
				version: 1,
				timezone: "UTC",
				notificationTime: "09:00",
				pushDevices: [],
			},
			{ owner: group },
		)

		await userAccount.$jazz.waitForAllCoValuesSync()
		await serverAccount.$jazz.waitForAllCoValuesSync()

		setActiveAccount(serverAccount)

		let result = await runWithoutActiveAccount(() =>
			registerNotificationSettingsWithServer(
				serverAccount,
				notificationSettings.$jazz.id,
				"test-user-123",
			),
		)

		expect(result.isOk()).toMatchInlineSnapshot(`true`)
	})
})

async function loadRefs(serverAccount: co.loaded<typeof ServerAccount>) {
	let loadedServer = await serverAccount.$jazz.ensureLoaded({
		resolve: { root: { notificationSettingsRefsV2: { $each: true } } },
	})
	return loadedServer.root.notificationSettingsRefsV2
}
