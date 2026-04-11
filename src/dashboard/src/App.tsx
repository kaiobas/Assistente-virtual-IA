import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import { AppLayout } from '@/components/layout/AppLayout'

// Páginas — lazy load por rota
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const AppointmentsPage = lazy(() => import('@/features/appointments/pages/AppointmentsPage'))
const ClientsPage = lazy(() => import('@/features/clients/pages/ClientsPage'))
const ConversationsPage = lazy(() => import('@/features/conversations/pages/ConversationsPage'))
const ProfessionalsPage = lazy(() => import('@/features/professionals/pages/ProfessionalsPage'))
const ServicesPage = lazy(() => import('@/features/services/pages/ServicesPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

function AppRoutes() {
  const { user, authLoading } = useAuth()

  // Segura todas as rotas (e portanto todas as queries) até a sessão ser confirmada
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    )
  }

  return (
    <AppLayout>
      <Suspense fallback={<div>Carregando...</div>}>
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.APPOINTMENTS} element={<AppointmentsPage />} />
          <Route path={ROUTES.CLIENTS} element={<ClientsPage />} />
          <Route path={ROUTES.CONVERSATIONS} element={<ConversationsPage />} />
          <Route path={ROUTES.PROFESSIONALS} element={<ProfessionalsPage />} />
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
