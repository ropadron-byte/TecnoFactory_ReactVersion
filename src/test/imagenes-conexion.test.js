import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buscarImagen,
  desacoplarImagenDe,
  desacoplarImagenDeTodos,
  eliminarImagen,
  listarImagenes,
  reemplazarImagen,
  subirImagen,
} from '../services/imagenesApi'
import { guardarSesion } from '../services/usuariosService'

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : (typeof datos === 'string' ? datos : JSON.stringify(datos))),
})

const IMAGEN = {
  id: 10,
  url: '/uploads/blog/portada.jpg',
  duenos: [
    { tipo: 'BLOG', id: 7 },
    { tipo: 'PRODUCTO', id: 3 },
  ],
}

const esperada = {
  id: 10,
  url: '/uploads/blog/portada.jpg',
  duenos: IMAGEN.duenos,
}

describe('Conexión de imágenes con la API', () => {
  let fetchMock

  beforeEach(() => {
    guardarSesion({ token: 'jwt-de-prueba' })
    fetchMock = vi.fn(() => Promise.resolve(respuesta(200, IMAGEN)))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista el catálogo paginado y conserva los dueños de cada imagen', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, { contenido: [IMAGEN], totalElementos: 1 }))

    const imagenes = await listarImagenes()

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/imagenes?size=1000')
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(imagenes).toEqual([esperada])
  })

  it('busca una imagen por id', async () => {
    const imagen = await buscarImagen(10)

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/imagenes/10')
    expect(imagen).toEqual(esperada)
  })

  it('sube una imagen a la carpeta general por defecto', async () => {
    const archivo = new File(['contenido'], 'general.jpg')
    fetchMock.mockResolvedValue(respuesta(201, IMAGEN))

    const imagen = await subirImagen(archivo)

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/imagenes')
    expect(url).not.toContain('/productos')
    expect(opciones.method).toBe('POST')
    expect(opciones.body).toBeInstanceOf(FormData)
    expect(opciones.body.get('archivo')).toBeInstanceOf(File)
    expect(opciones.body.get('archivo').name).toBe('general.jpg')
    expect(opciones.headers['Content-Type']).toBeUndefined()
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(imagen).toEqual(esperada)
  })

  it('sube una imagen de producto a su ruta específica', async () => {
    fetchMock.mockResolvedValue(respuesta(201, IMAGEN))

    await subirImagen(new File(['contenido'], 'producto.png'), 'productos')

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/imagenes/productos')
  })

  it('reemplaza el archivo con PUT /api/v1/imagenes/{id}', async () => {
    const archivo = new File(['nuevo'], 'reemplazo.png')

    await reemplazarImagen(10, archivo)

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/imagenes/10')
    expect(opciones.method).toBe('PUT')
    expect(opciones.body.get('archivo')).toBeInstanceOf(File)
    expect(opciones.body.get('archivo').name).toBe('reemplazo.png')
    expect(opciones.headers['Content-Type']).toBeUndefined()
  })

  it('elimina una imagen con DELETE', async () => {
    fetchMock.mockResolvedValue(respuesta(204))

    await eliminarImagen(10)

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/imagenes/10')
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })

  it('desacopla una imagen de todos sus dueños y de uno en particular', async () => {
    await desacoplarImagenDeTodos(10)
    await desacoplarImagenDe(10, 'BLOG', 7)

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/imagenes/10/duenos')
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/imagenes/10/duenos/BLOG/7')
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE')
  })

  it('propaga el error 409 cuando la imagen todavía está en uso', async () => {
    fetchMock.mockResolvedValue(respuesta(409, {
      mensaje: 'La imagen está en uso en 2 lugar(es); desacóplala antes de borrarla',
    }))

    await expect(eliminarImagen(10)).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      mensaje: expect.stringContaining('desacóplala antes de borrarla'),
    })
  })
})
