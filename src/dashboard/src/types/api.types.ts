/**
 * Tipos de resposta padrão para as service functions.
 * Todas as funções em services/ devem retornar esses tipos.
 */

// Resposta paginada do PostgREST
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

// Filtros comuns reutilizáveis
export interface DateRangeFilter {
  from: string // ISO 8601
  to: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}
