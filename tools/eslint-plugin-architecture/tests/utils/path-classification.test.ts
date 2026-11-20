import { test, expect } from "vitest"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
} from "../../utils/path-classification.js"

test("classifyFile", () => {
	let cases: [string, Parameters<typeof classifyFile>][] = [
		["screen", ["/project/src/app/features/notes/screens/NotesScreen.tsx"]],
		["widget", ["/project/src/app/features/notes/widgets/NotePreview.tsx"]],
		["part", ["/project/src/app/features/notes/parts/NoteListItem.tsx"]],
		["hook", ["/project/src/app/features/notes/hooks/useNotes.ts"]],
		["feature-lib", ["/project/src/app/features/notes/lib/utils.ts"]],
		["feature-index", ["/project/src/app/features/notes/index.ts"]],
		["app-component", ["/project/src/app/components/navigation.tsx"]],
		["shared-ui", ["/project/src/shared/ui/button.tsx"]],
		["route", ["/project/src/app/routes/__root.tsx"]],
		["handler", ["/project/src/server/features/push/handlers/register.ts"]],
		[
			"operation",
			["/project/src/server/features/push/operations/send-push.ts"],
		],
		[
			"server parts are excluded (use lib instead)",
			["/project/src/server/features/push/parts/send-notification.ts"],
		],
		["server lib", ["/project/src/server/features/push/lib/web-push.ts"]],
		["server feature-index", ["/project/src/server/features/push/index.ts"]],
		[
			"server middleware",
			["/project/src/server/features/auth/middleware/auth.ts"],
		],
		["server apps", ["/project/src/server/features/chat/apps/chat-app.ts"]],
		[
			"middleware in app features are unknown",
			["/project/src/app/features/notes/middleware/something.ts"],
		],
		[
			"apps in app features are unknown",
			["/project/src/app/features/notes/apps/something.ts"],
		],
		[
			"operations in app features are unknown",
			["/project/src/app/features/notes/operations/something.ts"],
		],
		[
			"handlers in app features are unknown",
			["/project/src/app/features/notes/handlers/something.ts"],
		],
		[
			"flat feature file classifies as unknown with feature name",
			["/project/src/app/features/notes/note-form.tsx"],
		],
		["completely unknown path", ["/project/src/lib/utils.ts"]],
		[
			"nested part",
			["/project/src/app/features/notes/parts/list/NoteListItem.tsx"],
		],
	]
	let table = cases.map(
		([label, args]) =>
			`${label}: ${args[0]} -> ${JSON.stringify(classifyFile(...args))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "screen: /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"screen","feature":"notes","root":"src/app/features"}",
		  "widget: /project/src/app/features/notes/widgets/NotePreview.tsx -> {"zone":"widget","feature":"notes","root":"src/app/features"}",
		  "part: /project/src/app/features/notes/parts/NoteListItem.tsx -> {"zone":"part","feature":"notes","root":"src/app/features"}",
		  "hook: /project/src/app/features/notes/hooks/useNotes.ts -> {"zone":"hook","feature":"notes","root":"src/app/features"}",
		  "feature-lib: /project/src/app/features/notes/lib/utils.ts -> {"zone":"feature-lib","feature":"notes","root":"src/app/features"}",
		  "feature-index: /project/src/app/features/notes/index.ts -> {"zone":"feature-index","feature":"notes","root":"src/app/features"}",
		  "app-component: /project/src/app/components/navigation.tsx -> {"zone":"app-component","feature":null,"root":null}",
		  "shared-ui: /project/src/shared/ui/button.tsx -> {"zone":"shared-ui","feature":null,"root":null}",
		  "route: /project/src/app/routes/__root.tsx -> {"zone":"route","feature":null,"root":null}",
		  "handler: /project/src/server/features/push/handlers/register.ts -> {"zone":"handler","feature":"push","root":"src/server/features"}",
		  "operation: /project/src/server/features/push/operations/send-push.ts -> {"zone":"operation","feature":"push","root":"src/server/features"}",
		  "server parts are excluded (use lib instead): /project/src/server/features/push/parts/send-notification.ts -> {"zone":"unknown","feature":"push","root":"src/server/features"}",
		  "server lib: /project/src/server/features/push/lib/web-push.ts -> {"zone":"feature-lib","feature":"push","root":"src/server/features"}",
		  "server feature-index: /project/src/server/features/push/index.ts -> {"zone":"feature-index","feature":"push","root":"src/server/features"}",
		  "server middleware: /project/src/server/features/auth/middleware/auth.ts -> {"zone":"middleware","feature":"auth","root":"src/server/features"}",
		  "server apps: /project/src/server/features/chat/apps/chat-app.ts -> {"zone":"app","feature":"chat","root":"src/server/features"}",
		  "middleware in app features are unknown: /project/src/app/features/notes/middleware/something.ts -> {"zone":"unknown","feature":"notes","root":"src/app/features"}",
		  "apps in app features are unknown: /project/src/app/features/notes/apps/something.ts -> {"zone":"unknown","feature":"notes","root":"src/app/features"}",
		  "operations in app features are unknown: /project/src/app/features/notes/operations/something.ts -> {"zone":"unknown","feature":"notes","root":"src/app/features"}",
		  "handlers in app features are unknown: /project/src/app/features/notes/handlers/something.ts -> {"zone":"unknown","feature":"notes","root":"src/app/features"}",
		  "flat feature file classifies as unknown with feature name: /project/src/app/features/notes/note-form.tsx -> {"zone":"unknown","feature":"notes","root":"src/app/features"}",
		  "completely unknown path: /project/src/lib/utils.ts -> {"zone":"unknown","feature":null,"root":null}",
		  "nested part: /project/src/app/features/notes/parts/list/NoteListItem.tsx -> {"zone":"part","feature":"notes","root":"src/app/features"}",
		]
	`)
})

test("classifyFile with custom feature roots", () => {
	let cases: [string, Parameters<typeof classifyFile>][] = [
		[
			"classifies shared feature lib",
			[
				"/project/src/shared/features/sync/lib/utils.ts",
				[
					{
						path: "src/shared/features",
						allowedZones: ["lib"],
					},
				],
			],
		],
		[
			"shared feature index",
			[
				"/project/src/shared/features/sync/index.ts",
				[
					{
						path: "src/shared/features",
						allowedZones: ["lib"],
					},
				],
			],
		],
		[
			"unrecognized zone in custom root is unknown",
			[
				"/project/src/shared/features/sync/screens/foo.tsx",
				[
					{
						path: "src/shared/features",
						allowedZones: ["lib"],
					},
				],
			],
		],
	]
	let table = cases.map(
		([label, args]) =>
			`${label}: ${args[0]} -> ${JSON.stringify(classifyFile(...args))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "classifies shared feature lib: /project/src/shared/features/sync/lib/utils.ts -> {"zone":"feature-lib","feature":"sync","root":"src/shared/features"}",
		  "shared feature index: /project/src/shared/features/sync/index.ts -> {"zone":"feature-index","feature":"sync","root":"src/shared/features"}",
		  "unrecognized zone in custom root is unknown: /project/src/shared/features/sync/screens/foo.tsx -> {"zone":"unknown","feature":"sync","root":"src/shared/features"}",
		]
	`)
})

test("classifyImport", () => {
	let cases: [string, Parameters<typeof classifyImport>][] = [
		[
			"alias import to parts",
			[
				"#app/features/notes/parts/NoteItem",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				DEFAULT_ALIASES,
			],
		],
		[
			"alias import to feature index (bare)",
			[
				"#app/features/people",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				DEFAULT_ALIASES,
			],
		],
		[
			"alias import to feature index (explicit)",
			[
				"#app/features/people/index",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				DEFAULT_ALIASES,
			],
		],
		[
			"alias import to shared ui",
			[
				"#shared/ui/button",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				DEFAULT_ALIASES,
			],
		],
		[
			"relative import within same feature",
			[
				"../parts/NoteItem",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				DEFAULT_ALIASES,
			],
		],
		[
			"package import returns unknown",
			[
				"react",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				DEFAULT_ALIASES,
			],
		],
		[
			"alias import to server operation",
			[
				"#server/features/push/operations/send-push",
				"/project/src/server/features/push/handlers/push-handler.ts",
				DEFAULT_ALIASES,
			],
		],
		[
			"alias import to server feature index (bare)",
			[
				"#server/features/push",
				"/project/src/server/features/chat/handlers/chat-handler.ts",
				DEFAULT_ALIASES,
			],
		],
	]
	let table = cases.map(
		([label, args]) =>
			`${label}: ${args[0]} from ${args[1]} -> ${JSON.stringify(classifyImport(...args))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "alias import to parts: #app/features/notes/parts/NoteItem from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"part","feature":"notes","root":"src/app/features"}",
		  "alias import to feature index (bare): #app/features/people from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"feature-index","feature":"people","root":"src/app/features"}",
		  "alias import to feature index (explicit): #app/features/people/index from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"feature-index","feature":"people","root":"src/app/features"}",
		  "alias import to shared ui: #shared/ui/button from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"shared-ui","feature":null,"root":null}",
		  "relative import within same feature: ../parts/NoteItem from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"part","feature":"notes","root":"src/app/features"}",
		  "package import returns unknown: react from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"unknown","feature":null,"root":null}",
		  "alias import to server operation: #server/features/push/operations/send-push from /project/src/server/features/push/handlers/push-handler.ts -> {"zone":"operation","feature":"push","root":"src/server/features"}",
		  "alias import to server feature index (bare): #server/features/push from /project/src/server/features/chat/handlers/chat-handler.ts -> {"zone":"feature-index","feature":"push","root":"src/server/features"}",
		]
	`)
})

test("classifyImport with custom feature roots", () => {
	let cases: [string, Parameters<typeof classifyImport>][] = [
		[
			"alias import to custom root feature index",
			[
				"#shared/features/sync",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				{ ...DEFAULT_ALIASES },
				[
					...DEFAULT_FEATURE_ROOTS,
					{ path: "src/shared/features", allowedZones: ["lib"] },
				],
			],
		],
		[
			"alias import to custom root lib",
			[
				"#shared/features/sync/lib/utils",
				"/project/src/app/features/notes/screens/NotesScreen.tsx",
				{ ...DEFAULT_ALIASES },
				[
					...DEFAULT_FEATURE_ROOTS,
					{ path: "src/shared/features", allowedZones: ["lib"] },
				],
			],
		],
	]
	let table = cases.map(
		([label, args]) =>
			`${label}: ${args[0]} from ${args[1]} -> ${JSON.stringify(classifyImport(...args))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "alias import to custom root feature index: #shared/features/sync from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"feature-index","feature":"sync","root":"src/shared/features"}",
		  "alias import to custom root lib: #shared/features/sync/lib/utils from /project/src/app/features/notes/screens/NotesScreen.tsx -> {"zone":"feature-lib","feature":"sync","root":"src/shared/features"}",
		]
	`)
})

test("isSameFeature", () => {
	let cases: [string, Parameters<typeof isSameFeature>][] = [
		[
			"same feature",
			[
				{ zone: "screen", feature: "notes", root: "src/app/features" },
				{ zone: "part", feature: "notes", root: "src/app/features" },
			],
		],
		[
			"different features",
			[
				{ zone: "screen", feature: "notes", root: "src/app/features" },
				{ zone: "part", feature: "people", root: "src/app/features" },
			],
		],
		[
			"null feature",
			[
				{ zone: "route", feature: null, root: null },
				{ zone: "screen", feature: "notes", root: "src/app/features" },
			],
		],
	]
	let table = cases.map(
		([label, args]) =>
			`${label}: ${JSON.stringify(args)} -> ${JSON.stringify(isSameFeature(...args))}`,
	)
	expect(table).toMatchInlineSnapshot(`
		[
		  "same feature: [{"zone":"screen","feature":"notes","root":"src/app/features"},{"zone":"part","feature":"notes","root":"src/app/features"}] -> true",
		  "different features: [{"zone":"screen","feature":"notes","root":"src/app/features"},{"zone":"part","feature":"people","root":"src/app/features"}] -> false",
		  "null feature: [{"zone":"route","feature":null,"root":null},{"zone":"screen","feature":"notes","root":"src/app/features"}] -> false",
		]
	`)
})
