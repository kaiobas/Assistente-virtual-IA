// Rotas da aplicação — fonte única de verdade para os paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  CLIENTS: '/clients',
  CONVERSATIONS: '/conversations',
  PROFESSIONALS: '/professionals',
  SERVICES: '/services',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
} as const

// Chaves de query para TanStack Query — evitar strings duplicadas
export const QUERY_KEYS = {
  APPOINTMENTS: 'appointments',
  CLIENTS: 'clients',
  CONVERSATIONS: 'conversations',
  PROFESSIONALS: 'professionals',
  SERVICES: 'services',
  BUSINESS: 'business',
  NOTIFICATIONS: 'notifications',
} as const
