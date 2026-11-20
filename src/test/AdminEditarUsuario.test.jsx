import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminEditarUsuario from '../pages/admin/AdminEditarUsuario.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerSesion } from '../services/usuariosService'

vi.mock('../services/usuariosApi.js', () => ({
  actualizarUsuario: vi.fn(),
}))
import { actualizarUsuario } from '../services/usuariosApi'

beforeEach(() => {
  vi.clearAllMocks()
  actualizarUsuario.mockResolvedValue({
    id: 1,
    run: '123456785',
    nombre: 'Jefe',
    apellidos: 'Tecno Factory',
    correo: 'ro.padron@duocuc.cl',
    tipo: 'Administrador',
    telefono: '+56912345678',
    fecha_nacimiento: '1990-01-01',
    activo: true,
  })
})

describe('Vista AdminEditarUsuario', () => {
  it('carga el usuario de la API, valida el nombre, guarda sin cambiar la clave y refresca la sesión', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    const datos = {
      id: 1,
      run: '123456785',
      nombre: 'Admin',
      apellidos: 'Tecno Factory',
      correo: 'ro.padron@duocuc.cl',
      tipo: 'Administrador',
      region: 'Región Metropolitana',
      comuna: 'Santiago',
      direccion: 'Casa Matriz Tecno Factory',
      telefono: '+56912345678',
      fecha_nacimiento: '1990-01-01',
      activo: true,
    }
    render(vista(AdminEditarUsuario, {
      ruta: '/admin/usuarios/1/editar',
      patron: '/admin/usuarios/:id/editar',
      datos,
    }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Editar usuario' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Admin')
    expect(screen.getByLabelText('Correo')).toHaveValue('ro.padron@duocuc.cl')
    expect(screen.getByLabelText('Tipo de usuario')).toHaveValue('Administrador')
    // El rol no se puede cambiar al editar.
    expect(screen.getByLabelText('Tipo de usuario')).toBeDisabled()
    expect(screen.getByLabelText('Nueva contraseña')).toHaveValue('')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(actualizarUsuario).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Nombre'), 'Jefe')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(actualizarUsuario).toHaveBeenCalledWith(1, expect.objectContaining({
      nombre: 'Jefe',
      contrasena: '',
      telefono: '+56912345678',
      fecha_nacimiento: '1990-01-01',
      activo: true,
    })))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario actualizado correctamente.')
    // Se edita al usuario en sesión: la sesión se refresca con lo que devolvió la API.
    expect(obtenerSesion().nombre).toBe('Jefe')
    expect(await screen.findByText('Destino: /admin/usuarios')).toBeInTheDocument()
  })
})
