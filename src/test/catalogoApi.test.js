import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_V1 } from '../services/api'
import { categoriaDesdeApi, productoDesdeApi, sincronizarCatalogo } from '../services/catalogoApi'
import { obtenerCategorias } from '../services/categoriasService'
import { obtenerProductoPorCodigo, obtenerProductos } from '../services/productosService'
import { precioFinal } from '../utils/precios'

// Producto tal como lo responde GET /api/v1/productos
const IPHONE_6 = {
  id: 2,
  nombre: 'iPhone 6',
  descripcion: 'Smartphone con pantalla grande.',
  precio: 284990,
  stock: 60,
  stockCritico: 7,
  descuento: 10,
  precioFinal: 256491,
  activo: true,
  categorias: [{ id: 10, nombre: 'Smartphones' }],
  imagenes: ['https://cdn.test/iphone-6/1.webp', 'https://cdn.test/iphone-6/2.webp'],
}
const MACBOOK = {
  id: 17,
  nombre: 'MacBook Pro 14',
  descripcion: null,
  precio: 1899990,
  stock: 24,
  stockCritico: 3,
  descuento: null,
  categorias: [{ id: 1, nombre: 'Notebooks' }],
  imagenes: [],
}
const CATEGORIAS_API = [
  { id: 1, nombre: 'Notebooks', descripcion: 'Equipos portátiles', cantidadProductos: 1, imagenes: [] },
  { id: 10, nombre: 'Smartphones', descripcion: 'Teléfonos', cantidadProductos: 1, imagenes: ['https://cdn.test/cat.png'] },
]

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(cuerpo),
})
const pagina = (contenido, numero, totalPaginas) => ({
  contenido,
  pagina: numero,
  tamanio: 100,
  totalElementos: contenido.length,
  totalPaginas,
})

describe('services/catalogoApi', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('conversión de datos', () => {
    it('convierte un producto del backend al formato de la tienda', () => {
      expect(productoDesdeApi(IPHONE_6)).toEqual({
        id: 2,
        codigo: '2',
        nombre: 'iPhone 6',
        categoria: 'Smartphones',
        descripcion: 'Smartphone con pantalla grande.',
        precio: 284990,
        stock: 60,
        stockCritico: 7,
        descuento: 10,
        urls: ['https://cdn.test/iphone-6/1.webp', 'https://cdn.test/iphone-6/2.webp'],
      })
    })

    it('completa lo que el backend deja vacío (descuento, descripción, imágenes, categoría)', () => {
      const producto = productoDesdeApi({ ...MACBOOK, categorias: [] })
      expect(producto.descuento).toBe(0)
      expect(producto.descripcion).toBe('')
      expect(producto.urls).toEqual([])
      expect(producto.categoria).toBe('')
    })

    it('convierte una categoría y usa su primera imagen como portada', () => {
      expect(categoriaDesdeApi(CATEGORIAS_API[1])).toEqual({
        id: 10,
        nombre: 'Smartphones',
        descripcion: 'Teléfonos',
        imagen: 'https://cdn.test/cat.png',
      })
      expect(categoriaDesdeApi(CATEGORIAS_API[0]).imagen).toBe('')
    })

    it('el precio final calculado en la tienda coincide con el del backend', () => {
      expect(precioFinal(productoDesdeApi(IPHONE_6))).toBe(IPHONE_6.precioFinal)
      // 1075 con 6 % da 1010,5: el backend redondea a 1011 y la tienda debe coincidir
      expect(precioFinal({ precio: 1075, descuento: 6 })).toBe(1011)
    })
  })

  describe('sincronizarCatalogo', () => {
    it('guarda categorías y productos del backend para que las vistas los lean', async () => {
      fetch.mockImplementation(async (url) =>
        url.includes('/categorias')
          ? respuesta(200, CATEGORIAS_API)
          : respuesta(200, pagina([IPHONE_6, MACBOOK], 0, 1)),
      )

      await expect(sincronizarCatalogo()).resolves.toBe(true)

      expect(obtenerProductos().map((p) => p.nombre)).toEqual(['iPhone 6', 'MacBook Pro 14'])
      expect(obtenerProductoPorCodigo('17').nombre).toBe('MacBook Pro 14')
      expect(obtenerCategorias().map((c) => c.nombre)).toEqual(['Notebooks', 'Smartphones'])
    })

    it('pide las rutas públicas sin token, con página de 100', async () => {
      localStorage.setItem('tf_token', 'abc')
      fetch.mockImplementation(async (url) =>
        url.includes('/categorias') ? respuesta(200, []) : respuesta(200, pagina([], 0, 1)),
      )

      await sincronizarCatalogo()

      const urls = fetch.mock.calls.map(([url]) => url)
      expect(urls).toContain(`${API_V1}/categorias`)
      expect(urls).toContain(`${API_V1}/productos?page=0&size=100`)
      fetch.mock.calls.forEach(([, opciones]) => expect(opciones.headers.Authorization).toBeUndefined())
    })

    it('junta todas las páginas cuando hay más de una', async () => {
      fetch.mockImplementation(async (url) => {
        if (url.includes('/categorias')) return respuesta(200, [])
        return url.includes('page=0')
          ? respuesta(200, pagina([IPHONE_6], 0, 2))
          : respuesta(200, pagina([MACBOOK], 1, 2))
      })

      await sincronizarCatalogo()

      expect(obtenerProductos().map((p) => p.codigo)).toEqual(['2', '17'])
    })

    it('si el backend falla devuelve false y deja la copia local como estaba', async () => {
      localStorage.setItem('tf_productos', JSON.stringify([{ codigo: 'X-1', nombre: 'Guardado', precio: 1, stock: 1 }]))
      fetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(sincronizarCatalogo()).resolves.toBe(false)

      expect(obtenerProductos().map((p) => p.nombre)).toEqual(['Guardado'])
    })

    it('si el backend responde con error tampoco toca lo guardado', async () => {
      localStorage.setItem('tf_productos', JSON.stringify([{ codigo: 'X-1', nombre: 'Guardado', precio: 1, stock: 1 }]))
      fetch.mockResolvedValue(respuesta(500, { mensaje: 'Error interno del servidor' }))

      await expect(sincronizarCatalogo()).resolves.toBe(false)

      expect(obtenerProductos()[0].nombre).toBe('Guardado')
    })
  })
})
