/**
 * Demo-mode helpers shared by the API client. Reads Zustand state directly
 * (not via a hook) since api.ts functions run outside React.
 */
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'

export function isDemoMode(): boolean {
  return useAuthStore.getState().isDemoMode
}

/** Mimics an axios response shape so `.then(r => r.data)` call sites need no changes. */
export function demoResponse<T>(data: T, delayMs = 250): Promise<{ data: T }> {
  return new Promise(resolve => setTimeout(() => resolve({ data }), delayMs))
}

/** For true data-mutating calls in demo mode — never reaches the real backend. */
export function blockDemoMutation(message = 'This is a read-only demo — sign in with real credentials to make changes.'): Promise<never> {
  toast.error(message, { icon: '🔒' })
  return Promise.reject(new Error('DEMO_READ_ONLY'))
}

export function isDemoBlockedError(err: unknown): boolean {
  return err instanceof Error && err.message === 'DEMO_READ_ONLY'
}
