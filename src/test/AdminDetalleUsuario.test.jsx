import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDetalleUsuario from '../pages/admin/AdminDetalleUsuario.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerUsuarioPorId } from '../services/usuariosService'

describe('Vista AdminDetalleUsuario', () => {
  it('muestra los datos del usuario y los enlaces a su edición e historial de compras', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminDetalleUsuario, { ruta: '/admin/usuarios/1', patron: '/admin/usuarios/:id', datos: obtenerUsuarioPorId(1) }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Admin Tecno Factory' })).toBeInTheDocument()
    for (const dato of ['123456785', 'admin@duoc.cl', 'Administrador', 'Región Metropolitana', 'Santiago', 'No especificada']) {
      expect(screen.getByText(dato)).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/admin/usuarios/1/editar')
    expect(screen.getByRole('link', { name: '← Volver al listado' })).toHaveAttribute('href', '/admin/usuarios')

    await user.click(screen.getByRole('link', { name: 'Historial de compras' }))
    expect(screen.getByText('Destino: /admin/usuarios/1/compras')).toBeInTheDocument()
  })
})
