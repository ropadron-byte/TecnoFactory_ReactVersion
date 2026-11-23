import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminProductos from '../pages/admin/AdminProductos.jsx'
import { ADMIN_SESION, entrarComoAdmin, vista } from './helpers.jsx'
import { guardarSesion } from '../services/usuariosService'
import { ApiError } from '../services/api'

vi.mock('../services/productosApi.js', () => ({
  crearProducto: vi.fn(),
  editarProducto: vi.fn(),
  desactivarProducto: vi.fn(),
  activarProducto: vi.fn(),
  listarProductosAdmin: vi.fn(() => Promise.resolve(null)),
}))
import { desactivarProducto } from '../services/productosApi'

const IPHONE = { id: 2, codigo: '2', nombre: 'iPhone 6', categoria: 'Smartphones', descripcion: '', precio: 284990, stock: 60, stockCritico: 7, descuento: 10, urls: [] }
const YOGA = { id: 20, codigo: '20', nombre: 'Lenovo Yoga 920', categoria: 'Notebooks', descripcion: '', precio: 1044990, stock: 3, stockCritico: 5, descuento: 0, urls: [] }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('tf_productos', JSON.stringify([IPHONE, YOGA]))
})

describe('Vista AdminProductos', () => {
  it('lista los productos y avisa el stock crítico', () => {
    entrarComoAdmin()
    render(vista(AdminProductos, { ruta: '/admin/productos' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Productos' })).toBeInTheDocument()
    expect(screen.getByText('iPhone 6')).toBeInTheDocument()
    expect(screen.getByText('Lenovo Yoga 920')).toBeInTheDocument()
    expect(screen.getByText('3 (crítico)')).toBeInTheDocument()
  })

  it('el administrador elimina un producto: muestra el error del backend y luego lo quita de la tabla', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    desactivarProducto.mockRejectedValueOnce(new ApiError(403, 'No tienes permiso para hacer esto.')).mockImplementation(async () => {
      localStorage.setItem('tf_productos', JSON.stringify([YOGA])) // el catálogo ya sin el producto
    })
    entrarComoAdmin()
    render(vista(AdminProductos, { ruta: '/admin/productos' }))

    const fila = () => screen.getByText('iPhone 6').closest('tr')
    await user.click(within(fila()).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para hacer esto.')
    expect(screen.getByText('iPhone 6')).toBeInTheDocument()

    await user.click(within(fila()).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('iPhone 6')).not.toBeInTheDocument())
    expect(desactivarProducto).toHaveBeenLastCalledWith('2')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('el vendedor solo ve los productos: sin crear, editar ni eliminar', () => {
    guardarSesion({ ...ADMIN_SESION, tipo: 'Vendedor' })
    render(vista(AdminProductos, { ruta: '/admin/productos' }))

    expect(screen.getByText('iPhone 6')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '+ Nuevo producto' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
  })
})
