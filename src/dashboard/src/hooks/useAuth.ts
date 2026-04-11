import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { setAuth, setBusinessId, clear } = useAuthStore()
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    /**
     * Fire-and-forget: busca business_id sem bloquear o fluxo de auth.
     * Usa .then() em vez de await para nunca travar o callback.
     */
    function loadBusinessId(userId: string) {
      void supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', userId)
        .single()
        .then(
          ({ data, error }) => {
            console.log('[useAuth] business_users:', { data, error })
            if (!ignore)
              setBusinessId(
                (data as { business_id: string } | null)?.business_id ?? null,
              )
          },
          (err: unknown) => console.error('[useAuth] business_users error:', err),
        )
    }

    // 1. Lê sessão do localStorage — libera o gate de loading.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (ignore) return
      console.log('[useAuth] getSession:', session?.user?.id ?? 'sem sessão')
      setAuth(session?.user ?? null, session)
      if (session?.user) loadBusinessId(session.user.id)
      setAuthLoading(false)
    })

    // 2. Eventos futuros (login, logout, token refresh).
    //    Callback SÍNCRONO — crítico para não bloquear os internals do Supabase.
    //    INITIAL_SESSION é ignorado (já tratado pelo getSession acima).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || ignore) return
      console.log('[useAuth] authChange:', event)

      setAuth(session?.user ?? null, session)

      if (session?.user) {
        loadBusinessId(session.user.id)
      } else {
        clear()
      }
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { ...useAuthStore(), authLoading }
}
