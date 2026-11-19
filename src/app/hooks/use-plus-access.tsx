import { createContext, use, type ReactNode } from "react"
import { useAuth } from "@clerk/clerk-react"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { PUBLIC_ENABLE_PAYWALL } from "astro:env/client"

export { useHasPlusAccess, ClerkPlusAccess, PlusAccess }
export type { PlusAccessState }

type PlusAccessState = { hasPlusAccess: boolean; isLoading: boolean }

// The app reads plus access from Clerk; the website demo has no Clerk and
// provides its own value.
let PlusAccess = createContext<PlusAccessState | null>(null)

function useHasPlusAccess(): PlusAccessState {
	let access = use(PlusAccess)
	if (!access) throw new Error("useHasPlusAccess needs a PlusAccess provider")
	return access
}

function ClerkPlusAccess({ children }: { children: ReactNode }) {
	let access = useClerkPlusAccess()
	return <PlusAccess value={access}>{children}</PlusAccess>
}

function useClerkPlusAccess(): PlusAccessState {
	let clerkAuth = useAuth()
	let isOnline = useOnlineStatus()

	if (!PUBLIC_ENABLE_PAYWALL) return { hasPlusAccess: true, isLoading: false }

	// When offline and auth not loaded, assume access to avoid infinite loading
	// (Clerk won't load offline, but chat will be disabled anyway)
	if (!isOnline && !clerkAuth.isLoaded) {
		return { hasPlusAccess: true, isLoading: false }
	}

	if (!clerkAuth.isLoaded) return { hasPlusAccess: false, isLoading: true }
	if (!clerkAuth.isSignedIn) return { hasPlusAccess: false, isLoading: false }

	return { hasPlusAccess: clerkAuth.has({ plan: "plus" }), isLoading: false }
}
