import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'

/**
 * Hook global de autenticação.
 * Inicializa e mantém sincronizado o estado de auth com o Supabase.
 * Deve ser usado uma única vez, no App.tsx.
 */
export function useAuth() {
  const { setAuth, setBusinessId, clear } = useAuthStore()

  useEffect(() => {
    // Recupera sessão existente ao carregar
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session)
    })

    // Escuta mudanças de autenticação em tempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuth(session?.user ?? null, session)

      if (session?.user) {
        // Busca o business_id do usuário logado
        const { data } = await supabase
          .from('business_users')
          .select('business_id')
          .eq('user_id', session.user.id)
          .single()

        setBusinessId((data as { business_id: string } | null)?.business_id ?? null)
      } else {
        clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [setAuth, setBusinessId, clear])

  return useAuthStore()
}
