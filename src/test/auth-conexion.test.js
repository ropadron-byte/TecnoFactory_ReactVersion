import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { actualizarPerfil, iniciarSesion, registrar } from '../services/authService'

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : JSON.stringify(datos)),
})

const USUARIO_API = {
  id: 1,
  run: 12345678,
  runDv: '5',
  nombre: 'Admin',
  apellidos: 'Tecno Factory',
  correo: 'ro.padron@duocuc.cl',
  fechaNacimiento: '1990-01-01',
  direccion: 'Casa Matriz',
  telefono: '+56912345678',
  comuna: 'Santiago',
  region: 'Metropolitana',
  tipoUsuario: 'ADMINISTRADOR',
  activo: true,
}

describe('Conexión de autenticación con la API', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn((url, _opciones) => {
      if (String(url).endsWith('/api/auth/login')) {
        return Promise.resolve(respuesta(200, { token: 'jwt-de-prueba', tipo: 'Bearer' }))
      }
      if (String(url).endsWith('/api/usuarios/me')) {
        return Promise.resolve(respuesta(200, USUARIO_API))
      }
      return Promise.resolve(respuesta(201, USUARIO_API))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hace login con POST y luego consulta /api/usuarios/me con el JWT', async () => {
    const sesion = await iniciarSesion('ro.padron@duocuc.cl', 'clave1234')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [urlLogin, opcionesLogin] = fetchMock.mock.calls[0]
    expect(urlLogin).toContain('/api/auth/login')
    expect(JSON.parse(opcionesLogin.body)).toEqual({ correo: 'ro.padron@duocuc.cl', clave: 'clave1234' })

    const [urlMe, opcionesMe] = fetchMock.mock.calls[1]
    expect(urlMe).toContain('/api/usuarios/me')
    expect(opcionesMe.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(sesion).toMatchObject({ token: 'jwt-de-prueba', origen: 'api', tipo: 'Administrador', nombre: 'Admin' })
  })

  it('registra clientes con POST /api/usuarios sin token', async () => {
    await registrar({ correo: 'nuevo@duocuc.cl', clave: 'clave1234' })

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/usuarios')
    expect(opciones.method).toBe('POST')
    expect(opciones.headers.Authorization).toBeUndefined()
  })

  it('actualiza el perfil con PUT /api/usuarios/me y renueva la sesión', async () => {
    const sesion = await actualizarPerfil({ nombre: 'Admin' }, 'jwt-de-prueba')

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/usuarios/me')
    expect(opciones.method).toBe('PUT')
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(JSON.parse(opciones.body)).toEqual({ nombre: 'Admin' })
    expect(sesion).toMatchObject({ token: 'jwt-de-prueba', nombre: 'Admin', tipo: 'Administrador' })
  })
})
