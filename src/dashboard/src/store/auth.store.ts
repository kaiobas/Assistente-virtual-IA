import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  businessId: string | null
  setAuth: (user: User | null, session: Session | null) => void
  setBusinessId: (id: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  businessId: null,
  setAuth: (user, session) => set({ user, session }),
  setBusinessId: (businessId) => set({ businessId }),
  clear: () => set({ user: null, session: null, businessId: null }),
}))
