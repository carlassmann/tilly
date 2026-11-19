import { expect, test } from "vitest"
import { parseInviteHash } from "./invite"

test("parseInviteHash", () => {
	let cases = {
		valid: "#/person/co_zABC123/invite/co_zDEF456/inviteSecret_zSECRET",
		empty: "",
		wrongPrefix: "#/other/path",
		invalidPersonId: "#/person/zABC/invite/co_zDEF/inviteSecret_zSEC",
		invalidGroupId: "#/person/co_zABC/invite/zDEF/inviteSecret_zSEC",
		invalidSecret: "#/person/co_zABC/invite/co_zDEF/zSEC",
		trailingSlash: "#/person/co_zABC/invite/co_zDEF/inviteSecret_zSEC/",
		extraSegment: "#/person/co_zABC/invite/co_zDEF/inviteSecret_zSEC/extra",
		longIds:
			"#/person/co_zLongId123ABC/invite/co_zAnotherId999/inviteSecret_zVeryLongSecret",
	}
	expect(
		Object.fromEntries(
			Object.entries(cases).map(([name, hash]) => [
				name,
				parseInviteHash(hash),
			]),
		),
	).toMatchInlineSnapshot(`
		{
		  "empty": null,
		  "extraSegment": null,
		  "invalidGroupId": null,
		  "invalidPersonId": null,
		  "invalidSecret": null,
		  "longIds": {
		    "inviteGroupId": "co_zAnotherId999",
		    "inviteSecret": "inviteSecret_zVeryLongSecret",
		    "personId": "co_zLongId123ABC",
		  },
		  "trailingSlash": null,
		  "valid": {
		    "inviteGroupId": "co_zDEF456",
		    "inviteSecret": "inviteSecret_zSECRET",
		    "personId": "co_zABC123",
		  },
		  "wrongPrefix": null,
		}
	`)
})
