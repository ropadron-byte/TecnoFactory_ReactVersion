import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IniciarSesion from '../pages/IniciarSesion.jsx'
import { vista } from './helpers.jsx'
import { obtenerSesion } from '../services/usuariosService'

describe('Vista IniciarSesion', () => {
  it('valida el formulario, rechaza credenciales malas y entra al panel con las correctas', async () => {
    const user = userEvent.setup()
    render(vista(IniciarSesion, { ruta: '/iniciar-sesion' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(screen.getByLabelText('Correo electrónico')).toHaveClass('is-invalid')
    expect(screen.getByLabelText('Contraseña')).toHaveClass('is-invalid')

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@duoc.cl')
    await user.type(screen.getByLabelText('Contraseña'), 'mala')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(obtenerSesion()).toBeNull()

    await user.clear(screen.getByLabelText('Contraseña'))
    await user.type(screen.getByLabelText('Contraseña'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByText('Sesión iniciada correctamente. Redirigiendo...')).toBeInTheDocument()
    expect(await screen.findByText('Destino: /admin')).toBeInTheDocument()
    expect(obtenerSesion().tipo).toBe('Administrador')
  })
})
