import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MiCuenta from '../pages/MiCuenta.jsx'
import { vista } from './helpers.jsx'
import { guardarSesion, obtenerSesion } from '../services/usuariosService'

// Reemplaza el botón real de Google por uno simple que entrega un credential.
vi.mock('../components/BotonGoogle.jsx', () => ({
  default: ({ onCredential }) => (
    <button type="button" onClick={() => onCredential('credential-de-prueba')}>
      Vincular Google
    </button>
  ),
}))

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : JSON.stringify(datos)),
})

const SESION = {
  token: 'jwt-de-prueba',
  origen: 'api',
  id: 1,
  run: '11111111',
  runDv: '1',
  nombre: 'Admin',
  apellidos: 'TecnoFactory',
  correo: 'ro.padron@duocuc.cl',
  tipo: 'Administrador',
  telefono: '+56912345678',
  fecha_nacimiento: '1990-01-01',
  comuna: 'Santiago',
  region: 'Región Metropolitana',
  direccion: 'Casa Matriz',
}

const USUARIO_ACTUALIZADO = {
  id: 1,
  run: 11111111,
  runDv: '1',
  nombre: 'Ana',
  apellidos: 'TecnoFactory',
  correo: 'ro.padron@duocuc.cl',
  fechaNacimiento: '1990-01-01',
  direccion: 'Nueva Casa 123',
  telefono: '+56987654321',
  activo: true,
  tipoUsuario: 'ADMINISTRADOR',
  comuna: 'Cerrillos',
  region: 'Metropolitana',
}

describe('Vista MiCuenta', () => {
  let fetchMock

  beforeEach(() => {
    guardarSesion(SESION)
    fetchMock = vi.fn((url, opciones) => {
      if (url.endsWith('/api/v1/usuarios/me') && opciones?.method === 'PUT') {
        return Promise.resolve(respuesta(200, USUARIO_ACTUALIZADO))
      }
      if (url.endsWith('/api/v1/auth/google/vincular')) {
        return Promise.resolve(respuesta(204))
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra los datos editables y guarda los cambios con PUT', async () => {
    const user = userEvent.setup()
    render(vista(MiCuenta, { ruta: '/mi-cuenta' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mi cuenta' })).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()

    // El correo es la cuenta y no se puede editar.
    expect(screen.getByLabelText('Correo')).toHaveValue('ro.padron@duocuc.cl')
    expect(screen.getByLabelText('Correo')).toHaveAttribute('readonly')

    expect(screen.getByLabelText('RUN')).toHaveValue('111111111')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Admin')
    expect(screen.getByLabelText('Región')).toHaveValue('Región Metropolitana')
    expect(screen.getByLabelText('Comuna')).toHaveValue('Santiago')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Ana')
    await user.clear(screen.getByLabelText('Teléfono'))
    await user.type(screen.getByLabelText('Teléfono'), '+56987654321')
    await user.clear(screen.getByLabelText('Dirección'))
    await user.type(screen.getByLabelText('Dirección'), 'Nueva Casa 123')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Cerrillos')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Perfil actualizado correctamente.')).toBeInTheDocument()

    const llamada = fetchMock.mock.calls.find(
      ([url, opciones]) => url.endsWith('/api/v1/usuarios/me') && opciones?.method === 'PUT',
    )
    expect(llamada).toBeTruthy()
    const [, opciones] = llamada
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(JSON.parse(opciones.body)).toEqual({
      run: 11111111,
      runDv: '1',
      nombre: 'Ana',
      apellidos: 'TecnoFactory',
      fechaNacimiento: '1990-01-01',
      direccion: 'Nueva Casa 123',
      telefono: '+56987654321',
      idComuna: 13102,
    })

    expect(obtenerSesion()).toMatchObject({ nombre: 'Ana', comuna: 'Cerrillos' })
  })

  it('vincula Google con el JWT', async () => {
    const user = userEvent.setup()
    render(vista(MiCuenta, { ruta: '/mi-cuenta' }))

    await user.click(screen.getByRole('button', { name: 'Vincular Google' }))
    expect(await screen.findByText('Cuenta de Google vinculada correctamente.')).toBeInTheDocument()

    const llamada = fetchMock.mock.calls.find(([url]) => url.endsWith('/api/v1/auth/google/vincular'))
    expect(llamada).toBeTruthy()
    const [url, opciones] = llamada
    expect(url).toContain('/api/v1/auth/google/vincular')
    expect(opciones.method).toBe('POST')
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(JSON.parse(opciones.body)).toEqual({ credential: 'credential-de-prueba' })
  })
})
