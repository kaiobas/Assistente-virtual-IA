/**
 * Configuração de tema por cliente.
 * Para trocar as cores do sistema, altere apenas os valores aqui.
 * O tema é aplicado via variáveis CSS no index.css.
 */
export const theme = {
  // Cor primária do cliente (sidebar, botões, destaques)
  primary: {
    DEFAULT: '#3B82F6', // blue-500
    light: '#EFF6FF', // blue-50
    dark: '#1D4ED8', // blue-700
    foreground: '#FFFFFF',
  },
  // Cor de fundo do sidebar
  sidebar: {
    background: '#1E3A5F',
    text: '#E2E8F0',
    active: '#3B82F6',
  },
} as const

export type Theme = typeof theme
