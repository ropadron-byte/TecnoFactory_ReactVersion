import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPerfil from '../pages/admin/AdminPerfil.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerSesion, obtenerUsuarioPorId } from '../services/usuariosService'

describe('Vista AdminPerfil', () => {
  it('muestra el perfil con RUN y tipo bloqueados y guarda los datos con la clave de la API', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminPerfil, { ruta: '/admin/perfil' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Admin')
    expect(screen.getByLabelText('RUN')).toHaveAttribute('readonly')
    expect(screen.queryByLabelText('Tipo de usuario')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Ana')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'nuevaClave1')
    await user.type(screen.getByLabelText('Teléfono'), '+56912345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Perfil actualizado correctamente.')
    expect(obtenerUsuarioPorId(1)).toMatchObject({
      nombre: 'Ana',
      contrasena: 'nuevaClave1',
      telefono: '+56912345678',
      fecha_nacimiento: '1990-01-01',
    })
    expect(obtenerSesion().nombre).toBe('Ana')

    await user.click(screen.getByRole('link', { name: 'Cancelar' }))
    expect(screen.getByText('Destino: /admin')).toBeInTheDocument()
  })
})
