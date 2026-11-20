import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNuevoUsuario from '../pages/admin/AdminNuevoUsuario.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { ApiError } from '../services/api'

vi.mock('../services/usuariosApi.js', () => ({
  crearUsuario: vi.fn(),
}))
import { crearUsuario } from '../services/usuariosApi'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Vista AdminNuevoUsuario', () => {
  it('valida el formulario, muestra el error de duplicado de la API y crea un vendedor', async () => {
    const user = userEvent.setup()
    crearUsuario
      .mockRejectedValueOnce(new ApiError(409, 'El correo ya está registrado'))
      .mockResolvedValue({ id: 2, nombre: 'Vera', apellidos: 'Rojas', correo: 'vera@duocuc.cl' })
    entrarComoAdmin()
    render(vista(AdminNuevoUsuario, { ruta: '/admin/usuarios/nuevo' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo usuario' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Vendedor' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cliente' })).toBeInTheDocument()
    // El panel no puede crear administradores.
    expect(screen.queryByRole('option', { name: 'Administrador' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    await user.type(screen.getByLabelText('RUN'), '190110222')
    await user.type(screen.getByLabelText('Nombre'), 'Vera')
    await user.type(screen.getByLabelText('Apellidos'), 'Rojas')
    await user.type(screen.getByLabelText('Correo'), 'ro.padron@duocuc.cl')
    await user.type(screen.getByLabelText('Contraseña'), 'clave12345')
    await user.type(screen.getByLabelText('Teléfono'), '+56912345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-05-20' } })
    await user.selectOptions(screen.getByLabelText('Tipo de usuario'), 'Vendedor')
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.type(screen.getByLabelText('Dirección'), 'Av. Siempre Viva 123')

    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado')
    expect(crearUsuario).toHaveBeenCalledWith(expect.objectContaining({
      run: '190110222',
      correo: 'ro.padron@duocuc.cl',
      contrasena: 'clave12345',
      telefono: '+56912345678',
      fecha_nacimiento: '1990-05-20',
      tipo: 'Vendedor',
      comuna: 'Santiago',
    }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar usuario' })).toBeEnabled())

    await user.clear(screen.getByLabelText('Correo'))
    await user.type(screen.getByLabelText('Correo'), 'vera@duocuc.cl')
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario creado correctamente en el servidor.')
    expect(crearUsuario).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Destino: /admin/usuarios')).toBeInTheDocument()
  })
})
