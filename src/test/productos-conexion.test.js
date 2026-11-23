import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_V1, ApiError } from '../services/api'
import { crearProducto, desactivarProducto, editarProducto } from '../services/productosApi'
import { obtenerProductos } from '../services/productosService'

// Categorías que la tienda ya sincronizó (los ids son los del backend)
const CATEGORIAS = [
  { id: 1, nombre: 'Notebooks', descripcion: 'Equipos portátiles', imagen: '' },
  { id: 10, nombre: 'Smartphones', descripcion: 'Teléfonos', imagen: '' },
]

// Producto tal como sale del formulario del panel
const FORMULARIO = {
  nombre: 'Notebook Test',
  descripcion: 'Equipo de prueba',
  precio: 599990,
  stock: 10,
  stockCritico: 2,
  categoria: 'Notebooks',
  descuento: 15,
  urls: ['https://cdn.test/nb/1.webp', 'https://cdn.test/nb/2.webp'],
}

// Producto tal como lo responde el backend
const CREADO = {
  id: 22,
  nombre: 'Notebook Test',
  descripcion: 'Equipo de prueba',
  precio: 599990,
  stock: 10,
  stockCritico: 2,
  descuento: 15,
  precioFinal: 509992,
  activo: true,
  categorias: [{ id: 1, nombre: 'Notebooks' }],
  imagenes: ['https://cdn.test/nb/1.webp', 'https://cdn.test/nb/2.webp'],
}

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
})
const pagina = (contenido) => ({ contenido, pagina: 0, tamanio: 100, totalElementos: contenido.length, totalPaginas: 1 })

/** Simula el backend. Después de cada cambio, el listado público devuelve `catalogo`. */
function backendCon(respuestas = {}, catalogo = [CREADO]) {
  const todas = {
    'GET /categorias': respuesta(200, []),
    'GET /productos?page=0&size=100': respuesta(200, pagina(catalogo)),
    ...respuestas,
  }
  const llamadas = []
  fetch.mockImplementation(async (url, opciones) => {
    const clave = `${opciones.method} ${url.replace(API_V1, '')}`
    llamadas.push({ clave, opciones })
    if (!todas[clave]) throw new Error(`Llamada inesperada: ${clave}`)
    return todas[clave]
  })
  return llamadas
}

describe('services/productosApi', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('tf_categorias', JSON.stringify(CATEGORIAS))
    localStorage.setItem('tf_sesion', JSON.stringify({ id: 1, tipo: 'Administrador', token: 'jwt-admin' }))
  })

  it('crea el producto en el backend con el id de su categoría y sus imágenes', async () => {
    const llamadas = backendCon({ 'POST /productos': respuesta(201, CREADO) })

    const creado = await crearProducto(FORMULARIO)

    const peticion = llamadas.find((l) => l.clave === 'POST /productos')
    expect(JSON.parse(peticion.opciones.body)).toEqual({
      nombre: 'Notebook Test',
      descripcion: 'Equipo de prueba',
      precio: 599990,
      stock: 10,
      stockCritico: 2,
      descuento: 15,
      categoriaIds: [1],
      imagenes: ['https://cdn.test/nb/1.webp', 'https://cdn.test/nb/2.webp'],
    })
    expect(peticion.opciones.headers.Authorization).toBe('Bearer jwt-admin')
    expect(creado).toMatchObject({ id: 22, codigo: '22', categoria: 'Notebooks', precio: 599990 })
  })

  it('después de crear vuelve a leer el catálogo para que la tienda lo muestre', async () => {
    backendCon({ 'POST /productos': respuesta(201, CREADO) })

    await crearProducto(FORMULARIO)

    expect(obtenerProductos().map((p) => p.codigo)).toEqual(['22'])
  })

  it('edita el producto por su id y no cambia su código', async () => {
    const llamadas = backendCon({ 'PUT /productos/22': respuesta(200, { ...CREADO, precio: 549990 }) })

    const editado = await editarProducto('22', { ...FORMULARIO, precio: 549990 })

    const peticion = llamadas.find((l) => l.clave === 'PUT /productos/22')
    expect(JSON.parse(peticion.opciones.body).precio).toBe(549990)
    expect(editado.codigo).toBe('22')
    expect(llamadas.map((l) => l.clave)).toContain('GET /productos?page=0&size=100')
  })

  it('desactivar elimina el producto del catálogo de la tienda', async () => {
    localStorage.setItem('tf_productos', JSON.stringify([{ id: 22, codigo: '22', nombre: 'Notebook Test', precio: 1, stock: 1 }]))
    const llamadas = backendCon({ 'DELETE /productos/22': respuesta(204) }, [])

    await desactivarProducto('22')

    expect(llamadas.map((l) => l.clave)[0]).toBe('DELETE /productos/22')
    expect(obtenerProductos()).toEqual([])
  })

  it('rechaza una categoría que la tienda no conoce, sin llamar al backend', async () => {
    const error = await crearProducto({ ...FORMULARIO, categoria: 'Inexistente' }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('La categoría seleccionada no existe.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('un código que no es numérico no existe en el backend', async () => {
    const error = await editarProducto('TF-NB-004', FORMULARIO).catch((e) => e)

    expect(error.status).toBe(404)
    expect(error.message).toBe('Producto no encontrado.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('si el backend rechaza el cambio (403) entrega su mensaje y no vuelve a leer el catálogo', async () => {
    const llamadas = backendCon({ 'POST /productos': respuesta(403, { mensaje: 'No tienes permiso para hacer esto.' }) })

    const error = await crearProducto(FORMULARIO).catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.message).toBe('No tienes permiso para hacer esto.')
    expect(llamadas.map((l) => l.clave)).toEqual(['POST /productos'])
  })

  it('muestra el mensaje de validación del backend (400)', async () => {
    backendCon({ 'POST /productos': respuesta(400, { mensaje: 'El descuento no puede ser mayor a 100' }) })

    const error = await crearProducto({ ...FORMULARIO, descuento: 150 }).catch((e) => e)

    expect(error.status).toBe(400)
    expect(error.message).toBe('El descuento no puede ser mayor a 100')
  })
})
