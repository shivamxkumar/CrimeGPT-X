/**
 * CrimeGPT — Global Auth Store (Zustand)
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
  login: (badge_number: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (badge_number, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.login(badge_number, password)
          localStorage.setItem('crimegpt_token', data.access_token)
          set({ user: data.user, token: data.access_token, isLoading: false })
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      logout: () => {
        localStorage.removeItem('crimegpt_token')
        set({ user: null, token: null })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'crimegpt-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

// Role helpers
export const useIsAdmin  = () => useAuthStore(s => s.user?.role === 'admin')
export const useIsSHO    = () => useAuthStore(s => ['admin','sho'].includes(s.user?.role || ''))
export const useIsIO     = () => useAuthStore(s => s.user?.role === 'io')
export const useIsLegal  = () => useAuthStore(s => s.user?.role === 'legal')
export const useRoleIn   = (...roles: string[]) => useAuthStore(s => roles.includes(s.user?.role || ''))
