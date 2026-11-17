import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegistroGoogle from '../pages/RegistroGoogle.jsx'
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

const PENDIENTE = {
  requiereCompletarPerfil: true,
  registroToken: 'token-de-registro',
  correo: 'nueva@hotmail.com',
  nombre: 'Nueva',
  apellidos: 'Persona',
}

const USUARIO = {
  id: 5,
  run: 19011022,
  runDv: '2',
  nombre: 'Nueva',
  apellidos: 'Persona',
  correo: 'nueva@hotmail.com',
  tipoUsuario: 'CLIENTE',
  activo: true,
}

describe('Vista RegistroGoogle', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn((url) => {
      if (url.endsWith('/api/auth/google')) {
        return Promise.resolve(respuesta(202, PENDIENTE))
      }
      if (url.endsWith('/api/auth/google/completar')) {
        return Promise.resolve(
          respuesta(201, {
            token: 'jwt-google',
            tipo: 'Bearer',
            correo: 'nueva@hotmail.com',
            rol: 'CLIENTE',
          }),
        )
      }
      if (url.endsWith('/api/usuarios/me')) {
        return Promise.resolve(respuesta(200, USUARIO))
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('autentica con Google y pide los datos personales antes de crear la cuenta', async () => {
    const user = userEvent.setup()
    render(vista(RegistroGoogle, { ruta: '/registro/google' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Regístrate con Google' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    // Google respondió 202: se muestra el formulario con el correo bloqueado.
    expect(await screen.findByLabelText('Correo')).toHaveValue('nueva@hotmail.com')
    expect(screen.getByLabelText('Correo')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Nueva')
    expect(screen.getByLabelText('Apellidos')).toHaveValue('Persona')

    await user.type(screen.getByLabelText('RUN'), '190110222')
    await user.type(screen.getByLabelText('Teléfono'), '912345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '2000-01-01' } })
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.type(screen.getByLabelText('Dirección'), 'Los Olmos 45')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Perfil completado. Redirigiendo...')).toBeInTheDocument()
    expect(await screen.findByText('Destino: /')).toBeInTheDocument()

    const llamada = fetchMock.mock.calls.find(([url]) => url.endsWith('/api/auth/google/completar'))
    expect(llamada).toBeTruthy()
    const [url, opciones] = llamada
    expect(url).toContain('/api/auth/google/completar')
    expect(JSON.parse(opciones.body)).toMatchObject({
      registroToken: 'token-de-registro',
      run: 19011022,
      runDv: '2',
      idComuna: 13101,
    })
    expect(JSON.parse(opciones.body)).not.toHaveProperty('correo')
    expect(obtenerSesion()).toMatchObject({ token: 'jwt-google', tipo: 'Cliente' })
    expect(sessionStorage.getItem('tf_google_pendiente')).toBeNull()
  })

  it('cancela el registro pendiente y vuelve al formulario de registro', async () => {
    sessionStorage.setItem('tf_google_pendiente', JSON.stringify(PENDIENTE))
    const user = userEvent.setup()
    render(vista(RegistroGoogle, { ruta: '/registro/google' }))

    expect(screen.getByLabelText('Correo')).toHaveValue('nueva@hotmail.com')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(await screen.findByText('Destino: /registro')).toBeInTheDocument()
    expect(sessionStorage.getItem('tf_google_pendiente')).toBeNull()
  })

  it('si el token temporal expiró, vuelve a mostrar el botón de Google', async () => {
    sessionStorage.setItem('tf_google_pendiente', JSON.stringify(PENDIENTE))
    fetchMock.mockImplementation((url) => {
      if (url.endsWith('/api/auth/google/completar')) {
        return Promise.resolve(respuesta(401, { mensaje: 'Token de registro inválido o expirado' }))
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })

    const user = userEvent.setup()
    render(vista(RegistroGoogle, { ruta: '/registro/google' }))

    await user.type(screen.getByLabelText('RUN'), '190110222')
    await user.type(screen.getByLabelText('Teléfono'), '912345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '2000-01-01' } })
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.type(screen.getByLabelText('Dirección'), 'Los Olmos 45')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(
      await screen.findByText('Tu registro con Google expiró. Continúa con Google otra vez.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument()
    expect(sessionStorage.getItem('tf_google_pendiente')).toBeNull()
  })
})
