import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, peticion, peticionFormData } from '../services/api'

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : (typeof datos === 'string' ? datos : JSON.stringify(datos))),
})

describe('Conexión HTTP con la API', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envía el JWT en el encabezado y parsea el JSON', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { contenido: [] }))

    const datos = await peticion('/api/v1/usuarios?size=1000', { token: 'jwt-de-prueba' })

    expect(datos).toEqual({ contenido: [] })
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/usuarios?size=1000')
    expect(opciones.method).toBe('GET')
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(opciones.headers.Accept).toBe('application/json')
  })

  it('envía el cuerpo JSON con el método indicado', async () => {
    fetchMock.mockResolvedValue(respuesta(201, { id: 1 }))

    await peticion('/api/v1/blogs', { metodo: 'POST', cuerpo: { titulo: 'Hola' } })

    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.method).toBe('POST')
    expect(opciones.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(opciones.body)).toEqual({ titulo: 'Hola' })
  })

  it('devuelve null para una respuesta 204', async () => {
    fetchMock.mockResolvedValue(respuesta(204))
    expect(await peticion('/api/v1/blogs/1', { metodo: 'DELETE' })).toBeNull()
  })

  it('convierte un error de la API en ApiError con mensaje y detalles', async () => {
    fetchMock.mockResolvedValue(respuesta(409, {
      mensaje: 'El correo ya está registrado',
      detalles: { correo: 'Ya existe' },
    }))

    await expect(peticion('/api/v1/usuarios', { metodo: 'POST', cuerpo: {} })).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      mensaje: 'El correo ya está registrado',
      detalles: { correo: 'Ya existe' },
    })
  })

  it('usa un mensaje por defecto cuando el backend no envía mensaje', async () => {
    fetchMock.mockResolvedValue(respuesta(403))
    await expect(peticion('/api/v1/blogs', { metodo: 'POST', cuerpo: {} })).rejects.toThrow('No tienes permisos para esta acción.')
  })

  it('informa de un error de red como ApiError con status 0', async () => {
    fetchMock.mockRejectedValue(new Error('sin conexión'))
    await expect(peticion('/api/v1/blogs')).rejects.toBeInstanceOf(ApiError)
    await expect(peticion('/api/v1/blogs')).rejects.toMatchObject({ status: 0 })
  })

  it('sube archivos como FormData sin fijar Content-Type', async () => {
    fetchMock.mockResolvedValue(respuesta(201, { id: 9, url: '/uploads/blog/imagen.jpg' }))
    const formData = new FormData()
    formData.append('archivo', new Blob(['contenido']), 'imagen.jpg')

    const imagen = await peticionFormData('/api/v1/blogs/1/imagenes', { formData, token: 'jwt-de-prueba' })

    expect(imagen).toEqual({ id: 9, url: '/uploads/blog/imagen.jpg' })
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/blogs/1/imagenes')
    expect(opciones.body).toBe(formData)
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(opciones.headers['Content-Type']).toBeUndefined()
  })
})
