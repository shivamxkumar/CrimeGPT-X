/**
 * CrimeGPT-X — Global Auth Store (Zustand)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '@/lib/api'

interface User {
  id: string
  badge_number: string
  name: string
  email: string
  role: 'io' | 'sho' | 'legal' | 'admin'
  police_station: string
  rank?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isDemoMode: boolean
  login: (badge_number: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  enterDemoMode: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isDemoMode: false,

      login: async (badge_number, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.login(badge_number, password)
          localStorage.setItem('crimegpt_token', data.access_token)
          set({ user: data.user, token: data.access_token, isLoading: false, isDemoMode: false })
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      logout: () => {
        localStorage.removeItem('crimegpt_token')
        set({ user: null, token: null, isDemoMode: false })
      },

      setUser: (user) => set({ user }),

      // "Explore Live Demo" — no backend call, no real credentials. Populates
      // the same store the AppShell/Sidebar already gate on, purely with
      // client-generated mock data. See lib/demo/mockData.ts + demoMode.ts.
      // Keep this profile in sync with DEMO_OFFICER in lib/demo/mockData.ts
      // (duplicated rather than imported — that file's User type carries
      // fields this store's narrower local User type doesn't need).
      enterDemoMode: () => {
        set({
          user: {
            id: 'demo-officer-001',
            badge_number: 'AHM-DEMO-IO-001',
            name: 'SI Kavita Rathod',
            email: 'kavita.rathod@demo.crimegpt-x.online',
            role: 'io',
            police_station: 'Ahmedabad Cyber Crime Branch',
            rank: 'Sub-Inspector',
          },
          token: 'demo-mode',
          isDemoMode: true,
        })
      },
    }),
    {
      name: 'crimegpt-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isDemoMode: state.isDemoMode }),
    }
  )
)

// Role helpers
export const useIsAdmin  = () => useAuthStore(s => s.user?.role === 'admin')
export const useIsSHO    = () => useAuthStore(s => ['admin','sho'].includes(s.user?.role || ''))
export const useIsIO     = () => useAuthStore(s => s.user?.role === 'io')
export const useIsLegal  = () => useAuthStore(s => s.user?.role === 'legal')
export const useRoleIn   = (...roles: string[]) => useAuthStore(s => roles.includes(s.user?.role || ''))

// ─── Selected Case (shared across Evidence/Diary/Documents/Legal pages) ───
interface CaseSelectionState {
  selectedCaseId: string | null
  setSelectedCaseId: (caseId: string | null) => void
}

export const useCaseSelectionStore = create<CaseSelectionState>()(
  persist(
    (set) => ({
      selectedCaseId: null,
      setSelectedCaseId: (caseId) => set({ selectedCaseId: caseId }),
    }),
    { name: 'crimegpt-selected-case' }
  )
)
