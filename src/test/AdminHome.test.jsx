import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminHome from '../pages/admin/AdminHome.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

describe('Vista AdminHome', () => {
  it('saluda al administrador, muestra métricas, alerta de stock crítico y accesos rápidos', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminHome, { ruta: '/admin' }))

    expect(screen.getByRole('heading', { level: 1, name: '¡Hola, Admin!' })).toBeInTheDocument()
    expect(screen.getByText('Inventario actual: 953 unidades')).toBeInTheDocument()
    expect(screen.getByText('Clientes: 0 · Vendedores: 0')).toBeInTheDocument()
    expect(screen.getByText('Total vendido: $0')).toBeInTheDocument()
    expect(screen.getByText(/Hay 1 producto\(s\) con stock crítico/)).toBeInTheDocument()
    for (const acceso of ['Órdenes', 'Productos', 'Categorías', 'Usuarios', 'Reportes', 'Perfil', 'Tienda']) {
      expect(screen.getByRole('link', { name: new RegExp(`^${acceso}`) })).toBeInTheDocument()
    }

    await user.click(screen.getByRole('link', { name: 'Ver listado' }))
    expect(screen.getByText('Destino: /admin/productos/criticos')).toBeInTheDocument()
  })
})
