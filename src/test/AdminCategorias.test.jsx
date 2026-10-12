import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminCategorias from '../pages/admin/AdminCategorias.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerCategorias } from '../services/categoriasService'

const confirmOriginal = window.confirm
afterEach(() => {
  window.confirm = confirmOriginal
})

describe('Vista AdminCategorias', () => {
  it('lista las categorías y solo elimina las vacías tras confirmar', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminCategorias, { ruta: '/admin/categorias' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Categorías' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(6)
    expect(screen.getByRole('row', { name: /Equipos portátiles/ })).toHaveTextContent('5')
    expect(screen.getAllByRole('link', { name: 'Editar' })[0]).toHaveAttribute('href', '/admin/categorias/1/editar')

    window.confirm = () => false
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[1])
    expect(screen.getByText('Audio')).toBeInTheDocument()

    window.confirm = () => true
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]) // Notebooks (tiene productos)
    expect(screen.getByRole('alert')).toHaveTextContent('No se puede eliminar "Notebooks"')
    expect(obtenerCategorias()).toHaveLength(6)

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[1]) // Audio (vacía)
    expect(screen.getByRole('alert')).toHaveTextContent('Categoría eliminada.')
    expect(screen.queryByText('Audio')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '+ Nueva categoría' }))
    expect(screen.getByText('Destino: /admin/categorias/nueva')).toBeInTheDocument()
  })
})
