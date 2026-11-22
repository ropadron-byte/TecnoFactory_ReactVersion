import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminCategorias from '../pages/admin/AdminCategorias.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { ApiError } from '../services/api'

vi.mock('../services/categoriasApi.js', () => ({
  crearCategoria: vi.fn(),
  editarCategoria: vi.fn(),
  borrarCategoria: vi.fn(),
}))
import { borrarCategoria } from '../services/categoriasApi'

const NOTEBOOKS = { id: 1, nombre: 'Notebooks', descripcion: 'Equipos portátiles', imagen: '' }
const AUDIO = { id: 11, nombre: 'Audio', descripcion: 'Parlantes y audífonos', imagen: '' }
const producto = (id, nombre, categoria) => ({ id, codigo: String(id), nombre, categoria, descripcion: '', precio: 1000, stock: 5, stockCritico: 1, descuento: 0, urls: [] })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('tf_categorias', JSON.stringify([NOTEBOOKS, AUDIO]))
  localStorage.setItem('tf_productos', JSON.stringify([producto(17, 'MacBook Pro', 'Notebooks'), producto(20, 'Lenovo Yoga', 'Notebooks')]))
})

describe('Vista AdminCategorias', () => {
  it('lista las categorías con su cantidad de productos', () => {
    entrarComoAdmin()
    render(vista(AdminCategorias, { ruta: '/admin/categorias' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Categorías' })).toBeInTheDocument()
    const notebooks = screen.getByText('Notebooks').closest('tr')
    expect(within(notebooks).getByText('2')).toBeInTheDocument()
    const audio = screen.getByText('Audio').closest('tr')
    expect(within(audio).getByText('0')).toBeInTheDocument()
  })

  it('muestra el mensaje del backend si la categoría tiene productos y luego elimina una vacía', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    borrarCategoria
      .mockRejectedValueOnce(new ApiError(409, "No se puede eliminar la categoría 'Notebooks' porque tiene productos asociados"))
      .mockImplementation(async () => {
        localStorage.setItem('tf_categorias', JSON.stringify([NOTEBOOKS])) // catálogo ya sin Audio
      })
    entrarComoAdmin()
    render(vista(AdminCategorias, { ruta: '/admin/categorias' }))

    await user.click(within(screen.getByText('Notebooks').closest('tr')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('tiene productos asociados')
    expect(screen.getByText('Notebooks')).toBeInTheDocument()

    await user.click(within(screen.getByText('Audio').closest('tr')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Categoría eliminada.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Audio')).not.toBeInTheDocument())
    expect(borrarCategoria).toHaveBeenLastCalledWith(11)
  })
})
