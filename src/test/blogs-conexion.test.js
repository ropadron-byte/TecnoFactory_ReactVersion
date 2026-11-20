import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activarBlog,
  actualizarBlog,
  agregarImagenExistente,
  buscarBlog,
  buscarBlogGestion,
  cambiarPortada,
  crearBlog,
  desactivarBlog,
  eliminarBlog,
  listarBlogs,
  listarBlogsGestion,
  quitarImagen,
  subirImagenBlog,
} from '../services/blogsApi'
import { guardarSesion } from '../services/usuariosService'
import { listarImagenes } from '../services/imagenesApi'

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : JSON.stringify(datos)),
})

const IMAGEN = { id: 10, url: '/uploads/blog/portada.jpg' }
const RESUMEN = { id: 7, titulo: 'Abrimos la tienda', fechaCreacion: '2026-08-12T10:00:00', imagenPrincipal: IMAGEN }
const PUBLICO = { ...RESUMEN, contenido: 'Contenido del blog.', imagenes: [IMAGEN] }
const GESTION = { ...RESUMEN, visible: true, autorNombre: 'Admin Tecno Factory' }
const DETALLE = {
  ...PUBLICO,
  visible: true,
  autorId: 1,
  autorNombre: 'Admin Tecno Factory',
  autorCorreo: 'ro.padron@duocuc.cl',
}

describe('Conexión de blogs con la API', () => {
  let fetchMock

  beforeEach(() => {
    guardarSesion({ token: 'jwt-de-prueba' })
    fetchMock = vi.fn(() => Promise.resolve(respuesta(200, DETALLE)))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista las publicaciones visibles y mapea la portada', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, { contenido: [RESUMEN], totalElementos: 1 }))

    const blogs = await listarBlogs()

    expect(fetchMock.mock.calls[0][0]).toContain('/api/blogs?size=1000')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(blogs).toEqual([{
      id: 7,
      titulo: 'Abrimos la tienda',
      fechaCreacion: '2026-08-12T10:00:00',
      imagenPrincipal: IMAGEN,
    }])
  })

  it('lee el detalle público sin exponer el autor', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, PUBLICO))
    const blog = await buscarBlog(7)

    expect(fetchMock.mock.calls[0][0]).toContain('/api/blogs/7')
    expect(blog).toMatchObject({ id: 7, contenido: 'Contenido del blog.' })
    expect(blog.imagenes).toEqual([IMAGEN])
    expect(blog.autorNombre).toBeUndefined()
  })

  it('lista y lee blogs desde el endpoint de gestión con el JWT', async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(200, { contenido: [GESTION] }))
      .mockResolvedValueOnce(respuesta(200, DETALLE))

    const filas = await listarBlogsGestion()
    const detalle = await buscarBlogGestion(7)

    expect(fetchMock.mock.calls[0][0]).toContain('/api/blogs/gestion?size=1000')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(fetchMock.mock.calls[1][0]).toContain('/api/blogs/gestion/7')
    expect(filas[0]).toMatchObject({ visible: true, autorNombre: 'Admin Tecno Factory' })
    expect(detalle).toMatchObject({ autorCorreo: 'ro.padron@duocuc.cl', visible: true })
  })

  it('crea y actualiza un blog con el cuerpo que espera el backend', async () => {
    await crearBlog({ titulo: 'Nuevo blog', contenido: 'Texto', visible: false, idImagenPrincipal: 10 })
    await actualizarBlog(7, { titulo: 'Editado', contenido: 'Texto nuevo', visible: true })

    const [urlCrear, opcionesCrear] = fetchMock.mock.calls[0]
    expect(urlCrear).toContain('/api/blogs')
    expect(opcionesCrear.method).toBe('POST')
    expect(JSON.parse(opcionesCrear.body)).toEqual({
      titulo: 'Nuevo blog',
      contenido: 'Texto',
      visible: false,
      idImagenPrincipal: 10,
    })

    const [urlEditar, opcionesEditar] = fetchMock.mock.calls[1]
    expect(urlEditar).toContain('/api/blogs/7')
    expect(opcionesEditar.method).toBe('PUT')
    expect(JSON.parse(opcionesEditar.body)).toMatchObject({ titulo: 'Editado', visible: true })
  })

  it('activa, desactiva y elimina con PATCH y DELETE', async () => {
    await activarBlog(7)
    await desactivarBlog(7)
    await eliminarBlog(7)

    expect(fetchMock.mock.calls.map(([, opciones]) => opciones.method)).toEqual(['PATCH', 'PATCH', 'DELETE'])
    expect(fetchMock.mock.calls[0][0]).toContain('/api/blogs/7/activar')
    expect(fetchMock.mock.calls[1][0]).toContain('/api/blogs/7/desactivar')
    expect(fetchMock.mock.calls[2][0]).toContain('/api/blogs/7')
  })

  it('lista el catálogo de imágenes para elegir una portada existente', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, { contenido: [IMAGEN] }))

    const imagenes = await listarImagenes()

    expect(fetchMock.mock.calls[0][0]).toContain('/api/imagenes?size=1000')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(imagenes).toEqual([{ ...IMAGEN, duenos: [] }])
  })

  it('sube una imagen como FormData y gestiona la galería y la portada', async () => {
    fetchMock.mockResolvedValue(respuesta(201, IMAGEN))
    const archivo = new File(['contenido'], 'imagen.jpg')
    const subida = await subirImagenBlog(7, archivo)
    const agregada = await agregarImagenExistente(7, 10)
    await cambiarPortada(7, 10)
    const quitada = await quitarImagen(7, 10)

    expect(subida).toEqual(IMAGEN)
    expect(agregada).toEqual(IMAGEN)
    expect(quitada).toEqual(IMAGEN)

    const [urlSubida, opcionesSubida] = fetchMock.mock.calls[0]
    expect(urlSubida).toContain('/api/blogs/7/imagenes')
    expect(opcionesSubida.body).toBeInstanceOf(FormData)
    expect(opcionesSubida.body.get('archivo')).toBeInstanceOf(File)
    expect(opcionesSubida.body.get('archivo').name).toBe('imagen.jpg')
    expect(opcionesSubida.headers['Content-Type']).toBeUndefined()

    expect(fetchMock.mock.calls[1][0]).toContain('/api/blogs/7/imagenes/10')
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
    expect(fetchMock.mock.calls[2][0]).toContain('/api/blogs/7/imagen-principal/10')
    expect(fetchMock.mock.calls[2][1].method).toBe('PUT')
    expect(fetchMock.mock.calls[3][0]).toContain('/api/blogs/7/imagenes/10')
    expect(fetchMock.mock.calls[3][1].method).toBe('DELETE')
  })
})
