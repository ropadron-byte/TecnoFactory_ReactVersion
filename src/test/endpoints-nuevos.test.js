import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_V1 } from '../services/api'
import { enviarContacto, listarContactos, buscarContacto } from '../services/contactosApi'
import { desactivarMiCuenta } from '../services/authService'
import { imagenPrincipalBlog } from '../services/blogsApi'
import { buscarCategoria } from '../services/categoriasApi'
import {
  activarProducto,
  buscarProducto,
  listarOfertas,
  listarProductosAdmin,
  listarProductosCriticos,
} from '../services/productosApi'
import { cambiarCantidad, obtenerCarrito, quitarItem } from '../services/carritoApi'
import { buscarBoleta, listarMisBoletas } from '../services/boletasApi'

const PRODUCTO = {
  id: 3,
  nombre: 'Auditónica',
  precio: 1000,
  stock: 5,
  stockCritico: 2,
  descuento: 0,
  categorias: [{ id: 1, nombre: 'Audio' }],
  imagenes: [],
}
const BOLETA = {
  id: 9,
  idUsuario: 2,
  fecha: '2026-11-23T12:00:00',
  total: 1000,
  estado: true,
  detalles: [{ id: 1, idProducto: 3, nombre: 'Auditónica', precioFinalUnitario: 1000, cantidad: 1, subtotal: 1000 }],
}

const pagina = (contenido) => ({ contenido, pagina: 0, tamanio: 100, totalElementos: contenido.length, totalPaginas: 1 })
const respuesta = (cuerpo, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(cuerpo ?? null) })

/** Backend de prueba: responde por "MÉTODO /ruta" y registra las llamadas. */
function backendCon(rutas) {
  const llamadas = []
  globalThis.fetch = vi.fn(async (url, opciones) => {
    const clave = `${opciones.method ?? 'GET'} ${String(url).replace(API_V1, '').replace('http://localhost:8080', '')}`
    llamadas.push(clave)
    const found = Object.entries(rutas).find(([ patron ]) => clave === patron || clave.startsWith(`${patron}?`))
    if (!found) throw new Error(`Llamada inesperada: ${clave}`)
    return found[1]
  })
  return llamadas
}

describe('endpoints incorporados al frontend', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('contacto: envía, lista y busca mensajes', async () => {
    const llamadas = backendCon({
      'POST /contactos': respuesta({ id: 1 }, 201),
      'GET /contactos': respuesta(pagina([{ id: 1, nombre: 'Ana' }])),
      'GET /contactos/1': respuesta({ id: 1, nombre: 'Ana' }),
    })

    await enviarContacto({ nombre: 'Ana', correo: 'ana@correo.cl', comentario: 'Hola' })
    expect(await listarContactos()).toHaveLength(1)
    expect((await buscarContacto(1)).nombre).toBe('Ana')
    expect(llamadas[0]).toBe('POST /contactos')
    expect(llamadas[1]).toContain('GET /contactos?')
    expect(llamadas[2]).toBe('GET /contactos/1')
  })

  it('usuarios: da de baja la propia cuenta', async () => {
    const llamadas = backendCon({ 'PATCH /usuarios/me/desactivar': respuesta(null, 204) })

    await desactivarMiCuenta('jwt')

    expect(llamadas).toEqual(['PATCH /usuarios/me/desactivar'])
  })

  it('blogs: consulta la portada', async () => {
    const llamadas = backendCon({ 'GET /blogs/7/imagen': respuesta({ id: 4, url: '/uploads/portada.jpg' }) })

    expect((await imagenPrincipalBlog(7)).url).toBe('/uploads/portada.jpg')
    expect(llamadas).toEqual(['GET /blogs/7/imagen'])
  })

  it('categorías: consulta el detalle', async () => {
    const llamadas = backendCon({
      'GET /categorias/1': respuesta({ id: 1, nombre: 'Audio', descripcion: 'Sonido', imagenes: [] }),
    })

    expect((await buscarCategoria(1)).nombre).toBe('Audio')
    expect(llamadas).toEqual(['GET /categorias/1'])
  })

  it('productos: ofertas, panel, críticos, detalle y reactivación', async () => {
    const llamadas = backendCon({
      'GET /productos/ofertas': respuesta(pagina([PRODUCTO])),
      'GET /productos/admin': respuesta(pagina([PRODUCTO])),
      'GET /productos/criticos': respuesta([PRODUCTO]),
      'GET /productos/3': respuesta(PRODUCTO),
      'PATCH /productos/3/activar': respuesta({ ...PRODUCTO, activo: true }),
      'GET /categorias': respuesta([]),
      'GET /productos': respuesta(pagina([PRODUCTO])),
    })

    expect(await listarOfertas()).toHaveLength(1)
    expect(await listarProductosAdmin()).toHaveLength(1)
    expect(await listarProductosCriticos()).toHaveLength(1)
    expect((await buscarProducto(3)).codigo).toBe('3')
    expect((await activarProducto(3)).activo).toBe(true)
    expect(llamadas.some((l) => l.startsWith('GET /productos/ofertas'))).toBe(true)
    expect(llamadas.some((l) => l.startsWith('GET /productos/admin'))).toBe(true)
    expect(llamadas).toContain('GET /productos/criticos')
    expect(llamadas).toContain('GET /productos/3')
    expect(llamadas).toContain('PATCH /productos/3/activar')
  })

  it('carrito: lee, cambia cantidad y quita un producto', async () => {
    const carrito = { items: [{ idProducto: 3, cantidad: 2 }], total: 2000 }
    const llamadas = backendCon({
      'GET /carrito': respuesta(carrito),
      'PUT /carrito/items/3': respuesta(carrito),
      'DELETE /carrito/items/3': respuesta(carrito),
    })

    expect(await obtenerCarrito()).toEqual([{ codigo: '3', qty: 2 }])
    expect(await cambiarCantidad(3, 2)).toEqual([{ codigo: '3', qty: 2 }])
    expect(await quitarItem(3)).toEqual([{ codigo: '3', qty: 2 }])
    expect(llamadas).toEqual(['GET /carrito', 'PUT /carrito/items/3', 'DELETE /carrito/items/3'])
  })

  it('boletas: lista las propias y busca una por id', async () => {
    const llamadas = backendCon({
      'GET /boletas/mias': respuesta(pagina([BOLETA])),
      'GET /boletas/9': respuesta(BOLETA),
    })

    expect(await listarMisBoletas()).toHaveLength(1)
    expect((await buscarBoleta(9)).id).toBe(9)
    expect(llamadas[0]).toContain('GET /boletas/mias?')
    expect(llamadas[1]).toBe('GET /boletas/9')
  })
})
