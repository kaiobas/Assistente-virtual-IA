import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('deve renderizar com acessibilidade correta', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('deve ter aria-label de carregando', () => {
    render(<LoadingSpinner />)
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()
  })

  it('deve aplicar tamanho correto', () => {
    render(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12')
  })

  it('deve aceitar className customizada', () => {
    render(<LoadingSpinner className="text-red-500" />)
    expect(screen.getByRole('status')).toHaveClass('text-red-500')
  })
})
