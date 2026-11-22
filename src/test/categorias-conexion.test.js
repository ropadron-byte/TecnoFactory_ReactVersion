import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_V1, ApiError } from '../services/api'
import { borrarCategoria, crearCategoria, editarCategoria } from '../services/categoriasApi'
import { obtenerCategorias } from '../services/categoriasService'

// Categoría tal como la responde el backend (POST/PUT /api/v1/categorias)
const AUDIO = { id: 11, nombre: 'Audio', descripcion: 'Parlantes y audífonos', cantidadProductos: 0, imagenes: ['https://cdn.test/audio.png'] }
const NOTEBOOKS = { id: 1, nombre: 'Notebooks', descripcion: 'Equipos portátiles', cantidadProductos: 2, imagenes: [] }

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
})

/** Simula el backend. `categorias` es lo que devuelve el listado público tras cada cambio. */
function backendCon(respuestas = {}, categorias = [NOTEBOOKS, AUDIO]) {
  const todas = {
    'GET /categorias': respuesta(200, categorias),
    'GET /productos?page=0&size=100': respuesta(200, { contenido: [], pagina: 0, tamanio: 100, totalElementos: 0, totalPaginas: 1 }),
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

describe('services/categoriasApi', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('tf_sesion', JSON.stringify({ id: 1, tipo: 'Administrador', token: 'jwt-admin' }))
  })

  it('crea la categoría con su imagen como lista de URLs y actualiza el catálogo', async () => {
    const llamadas = backendCon({ 'POST /categorias': respuesta(201, AUDIO) })

    const creada = await crearCategoria({ nombre: 'Audio', descripcion: 'Parlantes y audífonos', imagen: 'https://cdn.test/audio.png' })

    const peticion = llamadas.find((l) => l.clave === 'POST /categorias')
    expect(JSON.parse(peticion.opciones.body)).toEqual({
      nombre: 'Audio',
      descripcion: 'Parlantes y audífonos',
      imagenes: ['https://cdn.test/audio.png'],
    })
    expect(peticion.opciones.headers.Authorization).toBe('Bearer jwt-admin')
    expect(creada).toEqual({ id: 11, nombre: 'Audio', descripcion: 'Parlantes y audífonos', imagen: 'https://cdn.test/audio.png' })
    expect(obtenerCategorias().map((c) => c.nombre)).toEqual(['Notebooks', 'Audio'])
  })

  it('sin imagen manda una lista vacía', async () => {
    const llamadas = backendCon({ 'POST /categorias': respuesta(201, { ...AUDIO, imagenes: [] }) })

    await crearCategoria({ nombre: 'Audio', descripcion: 'Parlantes y audífonos', imagen: '' })

    expect(JSON.parse(llamadas.find((l) => l.clave === 'POST /categorias').opciones.body).imagenes).toEqual([])
  })

  it('edita la categoría por su id', async () => {
    const editada = { ...AUDIO, nombre: 'Sonido' }
    const llamadas = backendCon({ 'PUT /categorias/11': respuesta(200, editada) }, [NOTEBOOKS, editada])

    const resultado = await editarCategoria(11, { nombre: 'Sonido', descripcion: 'Parlantes y audífonos', imagen: 'https://cdn.test/audio.png' })

    expect(JSON.parse(llamadas.find((l) => l.clave === 'PUT /categorias/11').opciones.body).nombre).toBe('Sonido')
    expect(resultado.nombre).toBe('Sonido')
    expect(obtenerCategorias().map((c) => c.nombre)).toEqual(['Notebooks', 'Sonido'])
  })

  it('elimina la categoría y la saca del catálogo', async () => {
    const llamadas = backendCon({ 'DELETE /categorias/11': respuesta(204) }, [NOTEBOOKS])

    await borrarCategoria(11)

    expect(llamadas[0].clave).toBe('DELETE /categorias/11')
    expect(obtenerCategorias().map((c) => c.nombre)).toEqual(['Notebooks'])
  })

  it('si la categoría tiene productos (409) entrega el mensaje del backend y no cambia el catálogo', async () => {
    localStorage.setItem('tf_categorias', JSON.stringify([{ id: 1, nombre: 'Notebooks', descripcion: 'x', imagen: '' }]))
    const llamadas = backendCon({
      'DELETE /categorias/1': respuesta(409, { mensaje: "No se puede eliminar la categoría 'Notebooks' porque tiene productos asociados" }),
    })

    const error = await borrarCategoria(1).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.message).toBe("No se puede eliminar la categoría 'Notebooks' porque tiene productos asociados")
    expect(llamadas.map((l) => l.clave)).toEqual(['DELETE /categorias/1'])
    expect(obtenerCategorias().map((c) => c.nombre)).toEqual(['Notebooks'])
  })

  it('muestra el error cuando el nombre ya existe (409)', async () => {
    backendCon({ 'POST /categorias': respuesta(409, { mensaje: "Ya existe una categoría llamada 'Audio'" }) })

    const error = await crearCategoria({ nombre: 'Audio', descripcion: 'Otra', imagen: '' }).catch((e) => e)

    expect(error.status).toBe(409)
    expect(error.message).toBe("Ya existe una categoría llamada 'Audio'")
  })

  it('si el usuario no es administrador (403) entrega el mensaje de permisos', async () => {
    backendCon({ 'POST /categorias': respuesta(403) })

    const error = await crearCategoria({ nombre: 'Audio', descripcion: 'Otra', imagen: '' }).catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.message).toBe('No tienes permiso para hacer esto.')
  })

  it('un id que no es numérico no existe en el backend', async () => {
    const error = await editarCategoria('abc', { nombre: 'X', descripcion: 'Y', imagen: '' }).catch((e) => e)

    expect(error.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })
})
