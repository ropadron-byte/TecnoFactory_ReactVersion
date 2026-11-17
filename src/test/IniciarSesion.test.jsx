import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IniciarSesion from '../pages/IniciarSesion.jsx'
import { vista } from './helpers.jsx'
import { obtenerSesion } from '../services/usuariosService'

// Reemplaza el botón real de Google por uno simple que entrega un credential.
vi.mock('../components/BotonGoogle.jsx', () => ({
  default: ({ onCredential }) => (
    <button type="button" onClick={() => onCredential('credential-de-prueba')}>
      Continuar con Google
    </button>
  ),
}))

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : JSON.stringify(datos)),
})

const USUARIO_API = {
  id: 1,
  run: 11111111,
  runDv: '1',
  nombre: 'Admin',
  apellidos: 'TecnoFactory',
  correo: 'ro.padron@duocuc.cl',
  tipoUsuario: 'ADMINISTRADOR',
  activo: true,
}

describe('Vista IniciarSesion', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn((url, opciones) => {
      if (url.endsWith('/api/auth/login')) {
        const cuerpo = JSON.parse(opciones.body)
        if (cuerpo.clave === 'admin1234') {
          return Promise.resolve(
            respuesta(200, {
              token: 'jwt-de-prueba',
              tipo: 'Bearer',
              correo: cuerpo.correo,
              rol: 'ADMINISTRADOR',
            }),
          )
        }
        return Promise.resolve(respuesta(401, { mensaje: 'Credenciales inválidas' }))
      }
      if (url.endsWith('/api/usuarios/me')) {
        return Promise.resolve(respuesta(200, USUARIO_API))
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('valida el formulario, rechaza credenciales malas y entra al panel con las correctas', async () => {
    const user = userEvent.setup()
    render(vista(IniciarSesion, { ruta: '/iniciar-sesion' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(screen.getByLabelText('Correo electrónico')).toHaveClass('is-invalid')
    expect(screen.getByLabelText('Contraseña')).toHaveClass('is-invalid')

    await user.type(screen.getByLabelText('Correo electrónico'), 'ro.padron@duocuc.cl')
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(obtenerSesion()).toBeNull()

    await user.clear(screen.getByLabelText('Contraseña'))
    await user.type(screen.getByLabelText('Contraseña'), 'admin1234')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Sesión iniciada correctamente. Redirigiendo...')).toBeInTheDocument()
    expect(await screen.findByText('Destino: /admin')).toBeInTheDocument()

    const sesion = obtenerSesion()
    expect(sesion).toMatchObject({
      token: 'jwt-de-prueba',
      correo: 'ro.padron@duocuc.cl',
      tipo: 'Administrador',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('redirige a completar el registro cuando la cuenta de Google es nueva (202)', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((url) => {
      if (url.endsWith('/api/auth/google')) {
        return Promise.resolve(
          respuesta(202, {
            requiereCompletarPerfil: true,
            registroToken: 'token-de-registro',
            correo: 'nueva@gmail.com',
            nombre: 'Nueva',
            apellidos: 'Persona',
          }),
        )
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })

    render(vista(IniciarSesion, { ruta: '/iniciar-sesion' }))
    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    expect(await screen.findByText('Destino: /registro/google')).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem('tf_google_pendiente'))).toMatchObject({
      registroToken: 'token-de-registro',
      correo: 'nueva@gmail.com',
    })
    expect(obtenerSesion()).toBeNull()
  })

  it('inicia sesión directo cuando la cuenta de Google ya existe (200)', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((url) => {
      if (url.endsWith('/api/auth/google')) {
        return Promise.resolve(
          respuesta(200, {
            token: 'jwt-google',
            tipo: 'Bearer',
            correo: 'cliente@gmail.com',
            rol: 'CLIENTE',
          }),
        )
      }
      if (url.endsWith('/api/usuarios/me')) {
        return Promise.resolve(
          respuesta(200, {
            id: 9,
            run: 19011022,
            runDv: '2',
            nombre: 'Cliente',
            apellidos: 'Google',
            correo: 'cliente@gmail.com',
            tipoUsuario: 'CLIENTE',
            activo: true,
          }),
        )
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })

    render(vista(IniciarSesion, { ruta: '/iniciar-sesion' }))
    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    expect(await screen.findByText('Sesión iniciada correctamente. Redirigiendo...')).toBeInTheDocument()
    expect(await screen.findByText('Destino: /')).toBeInTheDocument()
    expect(obtenerSesion()).toMatchObject({ token: 'jwt-google', tipo: 'Cliente' })
  })
})
