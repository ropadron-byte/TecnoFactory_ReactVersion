import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegistroUsuario from '../pages/RegistroUsuario.jsx'
import { vista } from './helpers.jsx'
import { obtenerUsuarios } from '../services/usuariosService'

describe('Vista RegistroUsuario', () => {
  it('valida RUN y contraseñas y crea la cuenta como Cliente', async () => {
    const user = userEvent.setup()
    render(vista(RegistroUsuario, { ruta: '/registro' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    await user.type(screen.getByLabelText('RUN'), '190110228')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByLabelText('RUN')).toHaveClass('is-invalid')
    await user.clear(screen.getByLabelText('RUN'))
    await user.type(screen.getByLabelText('RUN'), '190110222')
    expect(screen.getByLabelText('RUN')).toHaveClass('is-valid')

    expect(screen.getByLabelText('Comuna')).toBeDisabled()
    await user.type(screen.getByLabelText('Nombre'), 'Luisa')
    await user.type(screen.getByLabelText('Apellidos'), 'Soto')
    await user.type(screen.getByLabelText('Correo'), 'luisa@gmail.com')
    await user.type(screen.getByLabelText('Contraseña'), 'abcd')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'zzzz')
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    expect(screen.getByLabelText('Comuna')).toBeEnabled()
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.type(screen.getByLabelText('Dirección'), 'Los Olmos 45')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveClass('is-invalid')
    expect(obtenerUsuarios()).toHaveLength(1)

    await user.clear(screen.getByLabelText('Confirmar contraseña'))
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'abcd')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('Cuenta creada correctamente. Redirigiendo...')).toBeInTheDocument()
    expect(obtenerUsuarios().find((u) => u.correo === 'luisa@gmail.com')).toMatchObject({ tipo: 'Cliente', nombre: 'Luisa' })
    expect(await screen.findByText('Destino: /iniciar-sesion')).toBeInTheDocument()
  })
})
