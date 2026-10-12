import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetalleCategoria from '../pages/DetalleCategoria.jsx'
import { vista } from './helpers.jsx'
import { obtenerCategoriaPorSlug } from '../services/categoriasService'

describe('Vista DetalleCategoria', () => {
  it('muestra solo los productos de la categoría, ofrece las otras categorías y permite volver', async () => {
    const user = userEvent.setup()
    render(vista(DetalleCategoria, { ruta: '/categorias/notebooks', patron: '/categorias/:slug', datos: obtenerCategoriaPorSlug('notebooks') }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Notebooks' })).toBeInTheDocument()
    expect(screen.getByText('Equipos portátiles para estudio, trabajo y diseño.')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(5)
    expect(screen.getByText('Lenovo Yoga 920')).toBeInTheDocument()
    expect(screen.queryByText('iPhone 5s')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Smartphones' })).toHaveAttribute('href', '/categorias/smartphones')
    expect(screen.queryByRole('link', { name: 'Notebooks' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '← Todas las categorías' }))
    expect(screen.getByText('Destino: /categorias')).toBeInTheDocument()
  })
})
