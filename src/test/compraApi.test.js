import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_V1, guardarToken, obtenerToken } from '../services/api'
import { comprar, ordenDesdeBoleta } from '../services/compraApi'
import { obtenerOrdenes } from '../services/ordenesService'
import { obtenerProductoPorCodigo } from '../services/productosService'

// Catálogo que la tienda tiene guardado antes de comprar (formato de la tienda)
const YOGA = {
  id: 20, codigo: '20', nombre: 'Lenovo Yoga 920', categoria: 'Notebooks', descripcion: '',
  precio: 1044990, stock: 40, stockCritico: 5, descuento: 0, urls: ['https://cdn.test/yoga/1.webp'],
}
const IPHONE = {
  id: 2, codigo: '2', nombre: 'iPhone 6', categoria: 'Smartphones', descripcion: '',
  precio: 284990, stock: 60, stockCritico: 7, descuento: 10, urls: [],
}
const CARRITO = [{ codigo: '20', qty: 2 }, { codigo: '2', qty: 1 }]
const CLIENTE = { nombre: 'Pedro', apellidos: 'Hacker', correo: 'pedro@gmail.com' }
const ENTREGA = { tipo: 'retiro', calle: '', departamento: '', region: '', comuna: '', indicaciones: '' }

// Lo que responde POST /api/v1/boletas/checkout
const BOLETA = {
  id: 5,
  idUsuario: 2,
  fecha: '2026-11-20T12:00:00',
  total: 2346471,
  estado: true,
  detalles: [
    { id: 1, idProducto: 20, nombre: 'Lenovo Yoga 920', precioUnitario: 1044990, descuento: 0, precioFinalUnitario: 1044990, cantidad: 2, subtotal: 2089980 },
    { id: 2, idProducto: 2, nombre: 'iPhone 6', precioUnitario: 284990, descuento: 10, precioFinalUnitario: 256491, cantidad: 1, subtotal: 256491 },
  ],
}

// Catálogo del backend después de la compra: el stock bajó
const PRODUCTOS_DESPUES = [
  { id: 20, nombre: 'Lenovo Yoga 920', descripcion: '', precio: 1044990, stock: 38, stockCritico: 5, descuento: 0, categorias: [{ id: 1, nombre: 'Notebooks' }], imagenes: [] },
  { id: 2, nombre: 'iPhone 6', descripcion: '', precio: 284990, stock: 59, stockCritico: 7, descuento: 10, categorias: [{ id: 10, nombre: 'Smartphones' }], imagenes: [] },
]

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
})

const RESPUESTAS_OK = {
  'DELETE /carrito': respuesta(204),
  'POST /carrito/items': respuesta(200, {}),
  'POST /boletas/checkout': respuesta(201, BOLETA),
  'GET /categorias': respuesta(200, []),
  'GET /productos?page=0&size=100': respuesta(200, { contenido: PRODUCTOS_DESPUES, pagina: 0, tamanio: 100, totalElementos: 2, totalPaginas: 1 }),
}

/** Simula el backend: responde según "MÉTODO /ruta" y devuelve la lista de llamadas recibidas. */
function backendCon(respuestas = {}) {
  const todas = { ...RESPUESTAS_OK, ...respuestas }
  const llamadas = []
  fetch.mockImplementation(async (url, opciones) => {
    const clave = `${opciones.method} ${url.replace(API_V1, '')}`
    llamadas.push(clave)
    if (!todas[clave]) throw new Error(`Llamada inesperada: ${clave}`)
    return todas[clave]
  })
  return llamadas
}

const comprarTodo = (extra = {}) =>
  comprar({ carrito: CARRITO, cliente: CLIENTE, entrega: ENTREGA, usuarioId: 2, ...extra })

describe('services/compraApi', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('tf_productos', JSON.stringify([YOGA, IPHONE]))
  })

  it('copia el carrito al backend, hace el checkout y arma la orden con la boleta', async () => {
    guardarToken('token-cliente')
    const llamadas = backendCon()

    const resultado = await comprarTodo()

    expect(resultado.ok).toBe(true)
    expect(llamadas.slice(0, 4)).toEqual([
      'DELETE /carrito',
      'POST /carrito/items',
      'POST /carrito/items',
      'POST /boletas/checkout',
    ])
    const cuerpos = fetch.mock.calls
      .filter(([url, opciones]) => url.endsWith('/carrito/items') && opciones.method === 'POST')
      .map(([, opciones]) => JSON.parse(opciones.body))
    expect(cuerpos).toEqual([
      { idProducto: 20, cantidad: 2 },
      { idProducto: 2, cantidad: 1 },
    ])
    fetch.mock.calls.forEach(([, opciones]) => {
      if (opciones.headers.Authorization) expect(opciones.headers.Authorization).toBe('Bearer token-cliente')
    })

    expect(resultado.orden).toMatchObject({
      id: 5,
      numero: '5',
      codigo: 'ORDER00005',
      estado: 'Pagada',
      usuarioId: 2,
      total: 2346471,
      cliente: CLIENTE,
      entrega: ENTREGA,
    })
    expect(resultado.orden.items[0]).toEqual({
      codigo: '20',
      nombre: 'Lenovo Yoga 920',
      imagen: 'https://cdn.test/yoga/1.webp',
      precio: 1044990,
      qty: 2,
      subtotal: 2089980,
    })
    expect(obtenerOrdenes()).toHaveLength(1)
  })

  it('toma el token de la sesión del login para comprar', async () => {
    localStorage.setItem('tf_sesion', JSON.stringify({ id: 2, token: 'jwt-de-la-sesion' }))
    backendCon()

    const resultado = await comprarTodo()

    expect(resultado.ok).toBe(true)
    const checkout = fetch.mock.calls.find(([url]) => url.endsWith('/boletas/checkout'))
    expect(checkout[1].headers.Authorization).toBe('Bearer jwt-de-la-sesion')
  })

  it('después de comprar actualiza el stock que ve la tienda', async () => {
    guardarToken('token-cliente')
    backendCon()

    await comprarTodo()

    expect(obtenerProductoPorCodigo('20').stock).toBe(38)
    expect(obtenerProductoPorCodigo('2').stock).toBe(59)
  })

  it('si el backend rechaza por stock (409) devuelve su mensaje y no guarda la orden', async () => {
    guardarToken('token-cliente')
    const llamadas = backendCon({
      'POST /carrito/items': respuesta(409, { mensaje: "Stock insuficiente para 'Lenovo Yoga 920': quedan 1 unidades" }),
    })

    const resultado = await comprarTodo()

    expect(resultado).toEqual({
      ok: false,
      motivo: 'stock',
      message: "Stock insuficiente para 'Lenovo Yoga 920': quedan 1 unidades",
    })
    expect(llamadas).not.toContain('POST /boletas/checkout')
    expect(obtenerOrdenes()).toEqual([])
  })

  it('sin sesión no llama al backend y pide iniciar sesión', async () => {
    const resultado = await comprarTodo()

    expect(resultado).toEqual({ ok: false, motivo: 'sesion', message: 'Debes iniciar sesión para pagar.' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('si el token venció (401) pide iniciar sesión y lo descarta', async () => {
    guardarToken('vencido')
    backendCon({ 'DELETE /carrito': respuesta(401) })

    const resultado = await comprarTodo()

    expect(resultado.motivo).toBe('sesion')
    expect(resultado.message).toBe('Debes iniciar sesión para continuar.')
    expect(obtenerToken()).toBeNull()
  })

  it('con el carrito vacío no hace nada', async () => {
    guardarToken('token-cliente')

    const resultado = await comprarTodo({ carrito: [] })

    expect(resultado).toEqual({ ok: false, motivo: 'vacio', message: 'Tu carrito está vacío.' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('el pago rechazado se registra como fallido sin tocar el backend ni el stock', async () => {
    guardarToken('token-cliente')

    const resultado = await comprarTodo({ resultadoPago: 'rechazado' })

    expect(fetch).not.toHaveBeenCalled()
    expect(resultado.ok).toBe(true)
    expect(resultado.orden).toMatchObject({ estado: 'Fallida', total: 2346471 })
    expect(resultado.orden.id).toBeGreaterThan(1e12) // nunca choca con el id de una boleta
    expect(obtenerOrdenes()).toHaveLength(1)
    expect(obtenerProductoPorCodigo('20').stock).toBe(40)
  })

  it('avisa cuando no hay conexión con el servidor', async () => {
    guardarToken('token-cliente')
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const resultado = await comprarTodo()

    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toBe('api')
    expect(resultado.message).toMatch(/backend esté encendido/)
  })

  it('una boleta anulada queda como orden "Anulada" y un producto desconocido no trae imagen', () => {
    const boleta = { ...BOLETA, estado: false, detalles: [{ ...BOLETA.detalles[0], idProducto: 999 }] }
    const orden = ordenDesdeBoleta(boleta, { cliente: CLIENTE, entrega: ENTREGA })

    expect(orden.estado).toBe('Anulada')
    expect(orden.items[0].codigo).toBe('999')
    expect(orden.items[0].imagen).toBe('')
  })
})
