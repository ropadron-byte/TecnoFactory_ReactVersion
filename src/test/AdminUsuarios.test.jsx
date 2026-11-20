import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminUsuarios from '../pages/admin/AdminUsuarios.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

vi.mock('../services/usuariosApi.js', () => ({
  listarUsuarios: vi.fn(),
  desactivarUsuario: vi.fn(),
  eliminarUsuario: vi.fn(),
}))
import { desactivarUsuario, eliminarUsuario, listarUsuarios } from '../services/usuariosApi'

const ADMIN = {
  id: 1,
  run: '123456785',
  nombre: 'Admin',
  apellidos: 'Tecno Factory',
  correo: 'ro.padron@duocuc.cl',
  tipo: 'Administrador',
  comuna: 'Santiago',
  activo: true,
}
const VENDEDOR = {
  id: 2,
  run: '190110222',
  nombre: 'Vera',
  apellidos: 'Rojas',
  correo: 'vera@duocuc.cl',
  tipo: 'Vendedor',
  comuna: 'Santiago',
  activo: true,
}

const confirmOriginal = window.confirm
afterEach(() => {
  window.confirm = confirmOriginal
})

beforeEach(() => {
  vi.clearAllMocks()
  listarUsuarios.mockResolvedValue([ADMIN, VENDEDOR])
  desactivarUsuario.mockResolvedValue({ ...VENDEDOR, activo: false })
  eliminarUsuario.mockResolvedValue(undefined)
})

describe('Vista AdminUsuarios', () => {
  it('lista los usuarios desde la API, oculta las acciones peligrosas del admin y elimina a un vendedor', async () => {
    const user = userEvent.setup()
    listarUsuarios.mockResolvedValueOnce([ADMIN, VENDEDOR]).mockResolvedValue([ADMIN])
    entrarComoAdmin()
    render(vista(AdminUsuarios, { ruta: '/admin/usuarios' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument()
    expect(await screen.findByText('Vera Rojas')).toBeInTheDocument()
    expect(screen.getByText('Admin Tecno Factory')).toBeInTheDocument()
    expect(screen.getByText('ro.padron@duocuc.cl')).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()

    // Solo los vendedores pueden desactivarse o eliminarse, nunca la propia cuenta.
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Desactivar' })).toHaveLength(1)

    window.confirm = () => true
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(eliminarUsuario).toHaveBeenCalledWith(2))
    expect(screen.getByRole('alert')).toHaveTextContent('Vendedor eliminado.')
    await waitFor(() => expect(screen.queryByText('Vera Rojas')).not.toBeInTheDocument())
    expect(listarUsuarios).toHaveBeenCalledTimes(2)

    await user.click(screen.getByRole('link', { name: 'Ver' }))
    expect(screen.getByText('Destino: /admin/usuarios/1')).toBeInTheDocument()
  })

  it('desactiva a un vendedor y recarga el listado', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminUsuarios, { ruta: '/admin/usuarios' }))

    expect(await screen.findByText('Vera Rojas')).toBeInTheDocument()
    window.confirm = () => true
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => expect(desactivarUsuario).toHaveBeenCalledWith(2))
    expect(screen.getByRole('alert')).toHaveTextContent('Vendedor desactivado.')
    expect(listarUsuarios).toHaveBeenCalledTimes(2)
  })
})
