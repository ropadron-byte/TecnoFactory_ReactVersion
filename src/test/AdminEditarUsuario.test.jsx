import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminEditarUsuario from '../pages/admin/AdminEditarUsuario.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerSesion, obtenerUsuarioPorId } from '../services/usuariosService'

describe('Vista AdminEditarUsuario', () => {
  it('carga el usuario, valida el nombre y guarda conservando la contraseña y actualizando la sesión', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminEditarUsuario, { ruta: '/admin/usuarios/1/editar', patron: '/admin/usuarios/:id/editar', datos: obtenerUsuarioPorId(1) }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Editar usuario' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Admin')
    expect(screen.getByLabelText('Correo')).toHaveValue('admin@duoc.cl')
    expect(screen.getByLabelText('Tipo de usuario')).toHaveValue('Administrador')
    expect(screen.getByLabelText('Nueva contraseña')).toHaveValue('')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    await user.type(screen.getByLabelText('Nombre'), 'Jefe')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Usuario actualizado correctamente.')
    expect(obtenerUsuarioPorId(1)).toMatchObject({ nombre: 'Jefe', contrasena: 'admin123' })
    expect(obtenerSesion().nombre).toBe('Jefe')
    expect(await screen.findByText('Destino: /admin/usuarios')).toBeInTheDocument()
  })
})
