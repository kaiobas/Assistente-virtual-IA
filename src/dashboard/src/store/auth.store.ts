import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  businessId: string | null
  demoMode: boolean
  setAuth: (user: User | null, session: Session | null) => void
  setBusinessId: (id: string | null) => void
  enableDemoMode: () => void
  disableDemoMode: () => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  businessId: null,
  demoMode: false,
  setAuth: (user, session) => set({ user, session }),
  setBusinessId: (businessId) => set({ businessId }),
  enableDemoMode: () => set({ demoMode: true }),
  disableDemoMode: () => set({ demoMode: false }),
  clear: () => set({ user: null, session: null, businessId: null, demoMode: false }),
}))
