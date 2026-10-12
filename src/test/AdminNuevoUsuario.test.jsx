import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNuevoUsuario from '../pages/admin/AdminNuevoUsuario.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerUsuarios } from '../services/usuariosService'

describe('Vista AdminNuevoUsuario', () => {
  it('valida RUN y correo duplicado y guarda un usuario nuevo', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminNuevoUsuario, { ruta: '/admin/usuarios/nuevo' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo usuario' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Vendedor' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    await user.type(screen.getByLabelText('RUN'), '190110228')
    await user.type(screen.getByLabelText('Nombre'), 'Vera')
    await user.type(screen.getByLabelText('Apellidos'), 'Rojas')
    await user.type(screen.getByLabelText('Correo'), 'admin@duoc.cl')
    await user.type(screen.getByLabelText('Contraseña'), 'vend1')
    await user.selectOptions(screen.getByLabelText('Tipo de usuario'), 'Vendedor')
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.type(screen.getByLabelText('Dirección'), 'Av. Siempre Viva 123')
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe un usuario registrado con ese correo.')
    expect(screen.getByLabelText('RUN')).toHaveClass('is-invalid')
    expect(obtenerUsuarios()).toHaveLength(1)

    await user.clear(screen.getByLabelText('RUN'))
    await user.type(screen.getByLabelText('RUN'), '190110222')
    await user.clear(screen.getByLabelText('Correo'))
    await user.type(screen.getByLabelText('Correo'), 'vera@duoc.cl')
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Usuario guardado correctamente.')
    expect(obtenerUsuarios().find((u) => u.correo === 'vera@duoc.cl')).toMatchObject({ tipo: 'Vendedor', nombre: 'Vera' })
    expect(await screen.findByText('Destino: /admin/usuarios')).toBeInTheDocument()
  })
})
