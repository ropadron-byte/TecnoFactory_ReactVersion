import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminHome from '../pages/admin/AdminHome.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

vi.mock('../hooks/useUsuarios.js', () => ({ useUsuarios: vi.fn() }))
vi.mock('../services/productosService.js', () => ({ obtenerProductos: () => [], esStockCritico: () => false }))
vi.mock('../services/ordenesService.js', () => ({ obtenerOrdenes: () => [] }))
import { useUsuarios } from '../hooks/useUsuarios'

beforeEach(() => {
  useUsuarios.mockReturnValue([
    { id: 1, tipo: 'Administrador' },
    { id: 2, tipo: 'Vendedor' },
    { id: 3, tipo: 'Cliente' },
    { id: 4, tipo: 'Cliente' },
  ])
})

describe('Vista AdminHome (datos de la API)', () => {
  it('saluda al administrador, resume los usuarios de la API y ofrece accesos al panel', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminHome, { ruta: '/admin' }))

    expect(screen.getByRole('heading', { level: 1, name: '¡Hola, Admin!' })).toBeInTheDocument()
    expect(screen.getByText('Clientes: 2 · Vendedores: 1')).toBeInTheDocument()
    expect(useUsuarios).toHaveBeenCalled()
    for (const acceso of ['Órdenes', 'Productos', 'Blogs', 'Categorías', 'Usuarios', 'Reportes', 'Perfil', 'Tienda']) {
      expect(screen.getByRole('link', { name: new RegExp(`^${acceso}`) })).toBeInTheDocument()
    }

    await user.click(screen.getByRole('link', { name: /^Blogs/ }))
    expect(screen.getByText('Destino: /admin/blogs')).toBeInTheDocument()
  })
})
