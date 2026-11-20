import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	plugins: [react()] as any,
	test: {
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		exclude: ["**/node_modules/**", "**/.reference/**"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		fileParallelism: false,
		// A test without assertions passes no matter what the code does.
		expect: { requireAssertions: true },
		typecheck: {
			enabled: true,
			// *.test-d.ts holds type-only tests: typechecked, never run, so
			// requireAssertions does not apply to them.
			include: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/*.test-d.ts"],
			tsconfig: "./tsconfig.vitest.json",
		},
	},
	resolve: {
		alias: {
			"astro:env/server": new URL(
				"./test-stubs/astro-env-server.ts",
				import.meta.url,
			).pathname,
			"astro:env/client": new URL(
				"./test-stubs/astro-env-client.ts",
				import.meta.url,
			).pathname,
			"#app": new URL("./src/app", import.meta.url).pathname,
			"#server": new URL("./src/server", import.meta.url).pathname,
			"#shared": new URL("./src/shared", import.meta.url).pathname,
			"#www": new URL("./src/www", import.meta.url).pathname,
		},
	},
})
