import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  API_V1,
  ApiError,
  borrarToken,
  eliminar,
  get,
  guardarToken,
  obtenerToken,
  patch,
  post,
  put,
  tokenActual,
} from '../services/api'

// Respuesta falsa de fetch: solo lo que usa api.js (ok, status y text()).
const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)),
})

const ultimaLlamada = () => {
  const [url, opciones] = fetch.mock.calls.at(-1)
  return { url, opciones }
}

describe('services/api', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('arma la URL con /api/v1 y omite los parámetros vacíos', async () => {
    fetch.mockResolvedValue(respuesta(200, { contenido: [] }))
    await get('/productos', { params: { page: 0, size: 5, sort: '', q: undefined, ids: [1, 2] } })
    expect(ultimaLlamada().url).toBe(`${API_V1}/productos?page=0&size=5&ids=1&ids=2`)
    expect(ultimaLlamada().opciones.method).toBe('GET')
  })

  it('devuelve el cuerpo JSON de una respuesta correcta', async () => {
    fetch.mockResolvedValue(respuesta(200, { id: 7, nombre: 'Notebook' }))
    await expect(get('/productos/7')).resolves.toEqual({ id: 7, nombre: 'Notebook' })
  })

  it('devuelve null cuando no hay cuerpo (204)', async () => {
    fetch.mockResolvedValue(respuesta(204))
    await expect(eliminar('/categorias/3')).resolves.toBeNull()
    expect(ultimaLlamada().opciones.method).toBe('DELETE')
  })

  it('envía el cuerpo como JSON en POST, PUT y PATCH', async () => {
    fetch.mockResolvedValue(respuesta(200, {}))
    await post('/categorias', { nombre: 'Audio' })
    expect(ultimaLlamada().opciones.method).toBe('POST')
    expect(ultimaLlamada().opciones.headers['Content-Type']).toBe('application/json')
    expect(ultimaLlamada().opciones.body).toBe(JSON.stringify({ nombre: 'Audio' }))

    await put('/categorias/1', { nombre: 'Sonido' })
    expect(ultimaLlamada().opciones.method).toBe('PUT')

    await patch('/boletas/4/anular')
    expect(ultimaLlamada().opciones.method).toBe('PATCH')
    expect(ultimaLlamada().opciones.body).toBeUndefined()
  })

  it('envía el token si existe y no lo envía en rutas públicas', async () => {
    fetch.mockResolvedValue(respuesta(200, {}))
    await get('/carrito')
    expect(ultimaLlamada().opciones.headers.Authorization).toBeUndefined()

    guardarToken('abc.def.ghi')
    await get('/carrito')
    expect(ultimaLlamada().opciones.headers.Authorization).toBe('Bearer abc.def.ghi')

    await get('/productos', { autenticar: false })
    expect(ultimaLlamada().opciones.headers.Authorization).toBeUndefined()
  })

  it('usa el token de la sesión del login y lo prefiere al guardado aparte', async () => {
    fetch.mockResolvedValue(respuesta(200, {}))
    expect(tokenActual()).toBeNull()
    guardarToken('guardado-aparte')
    expect(tokenActual()).toBe('guardado-aparte')

    localStorage.setItem('tf_sesion', JSON.stringify({ id: 2, token: 'jwt-de-la-sesion' }))
    expect(tokenActual()).toBe('jwt-de-la-sesion')
    await get('/carrito')
    expect(ultimaLlamada().opciones.headers.Authorization).toBe('Bearer jwt-de-la-sesion')
  })

  it('ignora una sesión dañada o sin token', () => {
    localStorage.setItem('tf_sesion', '{no es json')
    expect(tokenActual()).toBeNull()
    localStorage.setItem('tf_sesion', JSON.stringify({ id: 2 }))
    expect(tokenActual()).toBeNull()
  })

  it('guarda y borra el token en localStorage', () => {
    expect(obtenerToken()).toBeNull()
    guardarToken('xyz')
    expect(obtenerToken()).toBe('xyz')
    borrarToken()
    expect(obtenerToken()).toBeNull()
  })

  it('lanza un ApiError con el mensaje que manda el backend', async () => {
    fetch.mockResolvedValue(
      respuesta(409, { status: 409, error: 'Conflict', mensaje: "Stock insuficiente para 'iPhone X'", detalles: null }),
    )
    const error = await get('/boletas').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.message).toBe("Stock insuficiente para 'iPhone X'")
  })

  it('usa un mensaje por defecto cuando el error no trae cuerpo', async () => {
    fetch.mockResolvedValue(respuesta(403))
    const error = await post('/categorias', {}).catch((e) => e)
    expect(error.status).toBe(403)
    expect(error.message).toBe('No tienes permiso para hacer esto.')
  })

  it('en un error 500 muestra un mensaje genérico', async () => {
    fetch.mockResolvedValue(respuesta(500, '<html>error</html>'))
    const error = await get('/productos').catch((e) => e)
    expect(error.status).toBe(500)
    expect(error.message).toBe('Error interno del servidor. Inténtalo más tarde.')
  })

  it('descarta el token cuando el backend responde 401', async () => {
    guardarToken('vencido')
    fetch.mockResolvedValue(respuesta(401))
    const error = await get('/carrito').catch((e) => e)
    expect(error.status).toBe(401)
    expect(obtenerToken()).toBeNull()
  })

  it('conserva el token en otros errores', async () => {
    guardarToken('vigente')
    fetch.mockResolvedValue(respuesta(403))
    await get('/boletas').catch(() => {})
    expect(obtenerToken()).toBe('vigente')
  })

  it('avisa con status 0 cuando no hay conexión con el servidor', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await get('/productos').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/backend esté encendido/)
  })
})
