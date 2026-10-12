import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotFound from '../pages/NotFound.jsx'
import { vista } from './helpers.jsx'

describe('Vista NotFound', () => {
  it('avisa que la página no existe y permite volver al inicio', async () => {
    const user = userEvent.setup()
    render(vista(NotFound, { ruta: '/no-existe' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByText(/La página que buscas no existe/)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Volver al inicio' }))
    expect(screen.getByText('Destino: /')).toBeInTheDocument()
  })
})
