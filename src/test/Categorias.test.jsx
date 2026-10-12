import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Categorias from '../pages/Categorias.jsx'
import { vista } from './helpers.jsx'

describe('Vista Categorias', () => {
  it('muestra las tarjetas con su cantidad de productos, los separa por categoría y navega a una', async () => {
    const user = userEvent.setup()
    render(vista(Categorias, { ruta: '/categorias' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Compra por categoría' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Notebooks/ })).toHaveTextContent('5 productos')
    expect(screen.getByRole('link', { name: /Smartphones/ })).toHaveTextContent('16 productos')
    expect(screen.getByRole('link', { name: /Audio/ })).toHaveTextContent('0 productos')

    expect(screen.getByRole('heading', { level: 2, name: 'Notebooks' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Audio' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(21)

    await user.click(screen.getByRole('link', { name: /Notebooks/ }))
    expect(screen.getByText('Destino: /categorias/notebooks')).toBeInTheDocument()
  })
})
