import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNuevoProducto from '../pages/admin/AdminNuevoProducto.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { ApiError } from '../services/api'

vi.mock('../services/productosApi.js', () => ({
  crearProducto: vi.fn(),
  editarProducto: vi.fn(),
  desactivarProducto: vi.fn(),
}))
import { crearProducto } from '../services/productosApi'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem(
    'tf_categorias',
    JSON.stringify([
      { id: 1, nombre: 'Notebooks', descripcion: 'Equipos portátiles', imagen: '' },
      { id: 10, nombre: 'Smartphones', descripcion: 'Teléfonos', imagen: '' },
    ]),
  )
})

describe('Vista AdminNuevoProducto', () => {
  it('valida el formulario, muestra el error del backend y crea el producto', async () => {
    const user = userEvent.setup()
    crearProducto
      .mockRejectedValueOnce(new ApiError(403, 'No tienes permiso para hacer esto.'))
      .mockResolvedValue({ id: 22, codigo: '22', nombre: 'Notebook Test' })
    entrarComoAdmin()
    render(vista(AdminNuevoProducto, { ruta: '/admin/productos/nuevo' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo producto' })).toBeInTheDocument()
    // El código lo asigna el backend: no se pide al crear
    expect(screen.queryByLabelText('Código producto')).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Notebooks' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    // El precio es en pesos enteros: un decimal no se acepta
    await user.type(screen.getByLabelText('Nombre'), 'Notebook Test')
    await user.type(screen.getByLabelText('Descripción'), 'Equipo de prueba')
    await user.type(screen.getByLabelText('Precio'), '12.5')
    await user.type(screen.getByLabelText('Stock'), '10')
    await user.type(screen.getByLabelText('Stock crítico'), '2')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Notebooks')
    await user.type(screen.getByLabelText('Descuento (%)'), '15')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(screen.getByLabelText('Precio')).toHaveClass('is-invalid')
    expect(crearProducto).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText('Precio'))
    await user.type(screen.getByLabelText('Precio'), '599990')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para hacer esto.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar producto' })).toBeEnabled())

    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))
    expect(await screen.findByText('Producto guardado correctamente.')).toBeInTheDocument()
    expect(crearProducto).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nombre: 'Notebook Test',
        descripcion: 'Equipo de prueba',
        precio: 599990,
        stock: 10,
        stockCritico: 2,
        categoria: 'Notebooks',
        descuento: 15,
        urls: [],
      }),
    )
    expect(await screen.findByText('Destino: /admin/productos')).toBeInTheDocument()
  })
})
