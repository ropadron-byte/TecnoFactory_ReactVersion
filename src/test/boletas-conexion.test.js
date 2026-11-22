import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_V1, ApiError } from '../services/api'
import { anularBoleta, sincronizarBoletas } from '../services/boletasApi'
import { obtenerOrdenes } from '../services/ordenesService'

const DETALLE = (idProducto, nombre, precio, cantidad) => ({
  id: idProducto, idProducto, nombre, precioUnitario: precio, descuento: 0, precioFinalUnitario: precio, cantidad, subtotal: precio * cantidad,
})
// Boletas tal como las responde GET /api/v1/boletas
const BOLETA_5 = { id: 5, idUsuario: 2, fecha: '2026-11-20T12:00:00', total: 2346471, estado: true, detalles: [DETALLE(20, 'Lenovo Yoga 920', 1044990, 2), DETALLE(2, 'iPhone 6', 256491, 1)] }
const BOLETA_6 = { id: 6, idUsuario: 3, fecha: '2026-11-21T09:30:00', total: 284990, estado: false, detalles: [DETALLE(7, 'Oppo K1', 284990, 1)] }
const USUARIO_2 = { id: 2, nombre: 'Cliente', apellidos: 'Prueba', correo: 'cliente.prueba@example.com' }

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
})
const pagina = (contenido) => ({ contenido, pagina: 0, tamanio: 100, totalElementos: contenido.length, totalPaginas: 1 })

const sesion = (tipo) => localStorage.setItem('tf_sesion', JSON.stringify({ id: 1, tipo, token: 'jwt-personal' }))

/** Simula el backend: cada ruta "MÉTODO /ruta" responde un valor o una función. */
function backendCon(rutas = {}, boletas = () => [BOLETA_5, BOLETA_6]) {
  const todas = {
    'GET /boletas?page=0&size=100': () => respuesta(200, pagina(boletas())),
    'GET /usuarios/2': () => respuesta(200, USUARIO_2),
    'GET /usuarios/3': () => respuesta(403),
    'GET /categorias': () => respuesta(200, []),
    'GET /productos?page=0&size=100': () => respuesta(200, pagina([])),
    ...rutas,
  }
  const llamadas = []
  fetch.mockImplementation(async (url, opciones) => {
    const clave = `${opciones.method} ${url.replace(API_V1, '')}`
    llamadas.push(clave)
    if (!todas[clave]) throw new Error(`Llamada inesperada: ${clave}`)
    const salida = todas[clave]
    return typeof salida === 'function' ? salida() : salida
  })
  return llamadas
}

describe('services/boletasApi', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('sincronizarBoletas', () => {
    it('trae las boletas y arma las órdenes; el administrador completa el cliente', async () => {
      sesion('Administrador')
      backendCon()

      await expect(sincronizarBoletas()).resolves.toBe(true)

      const ordenes = obtenerOrdenes()
      expect(ordenes.map((o) => o.id)).toEqual([5, 6]) // de la más antigua a la más nueva
      expect(ordenes[0]).toMatchObject({
        numero: '5',
        codigo: 'ORDER00005',
        estado: 'Pagada',
        usuarioId: 2,
        total: 2346471,
        cliente: { nombre: 'Cliente', apellidos: 'Prueba', correo: 'cliente.prueba@example.com' },
        entrega: { tipo: 'no-registrada' },
      })
      expect(ordenes[0].items).toHaveLength(2)
      expect(ordenes[1].estado).toBe('Anulada')
    })

    it('si no se puede saber quién compró, queda como "Cliente #id"', async () => {
      sesion('Administrador')
      backendCon() // GET /usuarios/3 responde 403

      await sincronizarBoletas()

      expect(obtenerOrdenes()[1].cliente).toEqual({ nombre: 'Cliente', apellidos: '#3', correo: '' })
    })

    it('el vendedor no pide los datos de los usuarios', async () => {
      sesion('Vendedor')
      const llamadas = backendCon()

      await sincronizarBoletas()

      expect(llamadas.some((l) => l.startsWith('GET /usuarios'))).toBe(false)
      expect(obtenerOrdenes()[0].cliente).toEqual({ nombre: 'Cliente', apellidos: '#2', correo: '' })
    })

    it('conserva el cliente y la entrega de una compra hecha en este navegador', async () => {
      sesion('Administrador')
      localStorage.setItem(
        'tf_ordenes',
        JSON.stringify([
          {
            id: 5, numero: '5', fecha: '2026-11-20T12:00:00', estado: 'Pagada', usuarioId: 2, total: 2346471,
            cliente: { nombre: 'Pedro', apellidos: 'Hacker', correo: 'pedro@gmail.com' },
            entrega: { tipo: 'retiro', indicaciones: 'Preguntar por Pedro' },
            items: [{}, {}],
          },
        ]),
      )
      backendCon()

      await sincronizarBoletas()

      expect(obtenerOrdenes()[0].cliente.nombre).toBe('Pedro')
      expect(obtenerOrdenes()[0].entrega).toEqual({ tipo: 'retiro', indicaciones: 'Preguntar por Pedro' })
    })

    it('no confunde una orden local antigua con otra boleta que tiene el mismo id', async () => {
      sesion('Administrador')
      localStorage.setItem(
        'tf_ordenes',
        JSON.stringify([{ id: 5, fecha: '2026-01-01T10:00:00', estado: 'Pagada', total: 1000, cliente: { nombre: 'Otro', apellidos: '', correo: '' }, entrega: { tipo: 'retiro' }, items: [{}] }]),
      )
      backendCon()

      await sincronizarBoletas()

      expect(obtenerOrdenes()[0].cliente.nombre).toBe('Cliente')
      expect(obtenerOrdenes()[0].total).toBe(2346471)
    })

    it('conserva los pagos rechazados de la demo y descarta los antiguos', async () => {
      sesion('Administrador')
      const base = { estado: 'Fallida', total: 500, cliente: { nombre: 'X', apellidos: '', correo: '' }, entrega: { tipo: 'retiro' }, items: [] }
      localStorage.setItem(
        'tf_ordenes',
        JSON.stringify([
          { ...base, id: 3, fecha: '2026-02-01T10:00:00' }, // id chico: de la demo local antigua
          { ...base, id: 1763800000000, fecha: '2026-11-22T10:00:00.000Z' }, // pago rechazado de ahora
        ]),
      )
      backendCon()

      await sincronizarBoletas()

      expect(obtenerOrdenes().map((o) => o.id)).toEqual([5, 6, 1763800000000])
    })

    it('si el backend falla devuelve false y deja las órdenes como estaban', async () => {
      sesion('Administrador')
      localStorage.setItem('tf_ordenes', JSON.stringify([{ id: 9, fecha: '2026-11-01T10:00:00', estado: 'Pagada', total: 1, cliente: { nombre: 'A', apellidos: '', correo: '' }, entrega: { tipo: 'retiro' }, items: [] }]))
      fetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(sincronizarBoletas()).resolves.toBe(false)

      expect(obtenerOrdenes().map((o) => o.id)).toEqual([9])
    })
  })

  describe('anularBoleta', () => {
    it('anula en el backend, vuelve a leer las boletas y el stock, y devuelve la orden anulada', async () => {
      sesion('Administrador')
      let boletas = [BOLETA_5, BOLETA_6]
      const llamadas = backendCon(
        { 'PATCH /boletas/5/anular': () => { boletas = [{ ...BOLETA_5, estado: false }, BOLETA_6]; return respuesta(200, boletas[0]) } },
        () => boletas,
      )

      const orden = await anularBoleta(5)

      expect(llamadas[0]).toBe('PATCH /boletas/5/anular')
      expect(llamadas).toContain('GET /boletas?page=0&size=100')
      expect(llamadas).toContain('GET /productos?page=0&size=100') // el stock volvió: se relee el catálogo
      expect(orden).toMatchObject({ id: 5, estado: 'Anulada' })
    })

    it('si el backend la rechaza (409) entrega su mensaje y no relee nada', async () => {
      sesion('Administrador')
      const llamadas = backendCon({ 'PATCH /boletas/6/anular': () => respuesta(409, { mensaje: 'La boleta ya está anulada' }) })

      const error = await anularBoleta(6).catch((e) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(409)
      expect(error.message).toBe('La boleta ya está anulada')
      expect(llamadas).toEqual(['PATCH /boletas/6/anular'])
    })

    it('un vendedor no puede anular (403)', async () => {
      sesion('Vendedor')
      backendCon({ 'PATCH /boletas/5/anular': () => respuesta(403) })

      const error = await anularBoleta(5).catch((e) => e)

      expect(error.status).toBe(403)
      expect(error.message).toBe('No tienes permiso para hacer esto.')
    })
  })
})
