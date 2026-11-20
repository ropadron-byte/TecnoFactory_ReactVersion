import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminReportes from '../pages/admin/AdminReportes.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

vi.mock('../hooks/useUsuarios.js', () => ({ useUsuarios: vi.fn() }))
vi.mock('../services/ordenesService.js', () => ({ obtenerOrdenes: () => [] }))
import { useUsuarios } from '../hooks/useUsuarios'

beforeEach(() => {
  useUsuarios.mockReturnValue([
    { id: 1, tipo: 'Administrador' },
    { id: 2, tipo: 'Vendedor' },
    { id: 3, tipo: 'Vendedor' },
    { id: 4, tipo: 'Cliente' },
  ])
})

describe('Vista AdminReportes (usuarios desde la API)', () => {
  it('muestra el resumen de usuarios por tipo obtenido de la API', async () => {
    entrarComoAdmin()
    render(vista(AdminReportes, { ruta: '/admin/reportes' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Reportes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Usuarios por tipo' })).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(useUsuarios).toHaveBeenCalled()
  })
})
