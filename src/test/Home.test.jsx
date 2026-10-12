import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../pages/Home.jsx'
import { vista } from './helpers.jsx'

describe('Vista Home', () => {
  it('muestra bienvenida, beneficios, categorías y productos más vendidos, y navega a una categoría', async () => {
    const user = userEvent.setup()
    render(vista(Home))

    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido a Tecno Factory' })).toBeInTheDocument()
    for (const beneficio of ['Envíos a todo Chile', 'Garantía Asegurada', 'Pago Seguro', 'Soporte Continuo']) {
      expect(screen.getByText(beneficio)).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { name: 'Categorías' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Productos Más Vendidos' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver producto' })).toHaveLength(8)
    expect(screen.getByText('iPhone 5s')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Notebooks/ }))
    expect(screen.getByText('Destino: /categorias/notebooks')).toBeInTheDocument()
  })
})
