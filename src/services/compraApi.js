import { STORAGE_KEYS } from '../data/constantes'
import { ApiError, eliminar, obtenerToken, post } from './api'
import { sincronizarCatalogo } from './catalogoApi'
import { completarConUsuario, itemsDeCarrito, obtenerOrdenes } from './ordenesService'
import { imagenesProducto, obtenerProductoPorCodigo } from './productosService'

// Compra contra el backend.
//
// El carrito sigue viviendo en el navegador (CartContext). Al pagar se copia al carrito
// del backend y se llama a POST /boletas/checkout: el backend valida el stock, descuenta
// las unidades, guarda la boleta (con copia del nombre, precio y descuento de cada
// producto) y vacía su carrito.
//
// El backend solo guarda la boleta. Los datos del cliente y de la entrega (retiro o
// despacho) se guardan en el navegador, dentro de la orden, para mostrarlos en la
// pantalla de compra y en la boleta impresa.

const dosDigitos = (n) => String(n).padStart(2, '0')

function guardarOrden(orden) {
  const otras = obtenerOrdenes().filter((o) => o.id !== orden.id)
  localStorage.setItem(STORAGE_KEYS.ordenes, JSON.stringify([...otras, orden]))
}

/** Boleta del backend + datos del cliente y la entrega -> orden de la tienda.
 * El número de la boleta es el id que le asignó el backend. */
export function ordenDesdeBoleta(boleta, { cliente, entrega, usuarioId = null }) {
  return {
    id: boleta.id,
    numero: String(boleta.id),
    codigo: `ORDER${String(boleta.id).padStart(5, '0')}`,
    fecha: boleta.fecha,
    estado: boleta.estado ? 'Pagada' : 'Anulada',
    usuarioId,
    cliente,
    entrega,
    items: boleta.detalles.map((d) => {
      const codigo = String(d.idProducto)
      const producto = obtenerProductoPorCodigo(codigo)
      return {
        codigo,
        nombre: d.nombre,
        imagen: producto ? (imagenesProducto(producto)[0] ?? '') : '',
        precio: d.precioFinalUnitario,
        qty: d.cantidad,
        subtotal: d.subtotal,
      }
    }),
    total: boleta.total,
  }
}

/** El pago rechazado es solo de la demostración y no llega al backend: no hay boleta
 * ni se descuenta stock. Se guarda en el navegador con un id enorme (la hora en
 * milisegundos) para que nunca choque con el id de una boleta real. */
function registrarPagoRechazado({ items, cliente, entrega, usuarioId }) {
  const ahora = new Date()
  const marca = `${ahora.getFullYear()}${dosDigitos(ahora.getMonth() + 1)}${dosDigitos(ahora.getDate())}`
  const hora = `${dosDigitos(ahora.getHours())}${dosDigitos(ahora.getMinutes())}${dosDigitos(ahora.getSeconds())}`
  const orden = {
    id: ahora.getTime(),
    numero: `F${marca}${hora}`,
    codigo: `ORDERF${hora}`,
    fecha: ahora.toISOString(),
    estado: 'Fallida',
    usuarioId,
    cliente,
    entrega,
    items,
    total: items.reduce((suma, i) => suma + i.subtotal, 0),
  }
  guardarOrden(orden)
  return orden
}

/**
 * Procesa la compra. Devuelve lo mismo que devolvía procesarCompra:
 *  { ok: true, orden }  o  { ok: false, motivo: 'vacio' | 'sesion' | 'stock' | 'api', message }
 *  - resultadoPago: 'exitoso' | 'rechazado' (lo elige el cliente en la demo)
 */
export async function comprar({ carrito, cliente: clienteForm, entrega: entregaForm, usuarioId = null, resultadoPago = 'exitoso' }) {
  const { cliente, entrega } = completarConUsuario(usuarioId, clienteForm, entregaForm)
  const items = itemsDeCarrito(carrito)
  if (items.length === 0) return { ok: false, motivo: 'vacio', message: 'Tu carrito está vacío.' }

  if (resultadoPago === 'rechazado') {
    return { ok: true, orden: registrarPagoRechazado({ items, cliente, entrega, usuarioId }) }
  }

  if (!obtenerToken()) return { ok: false, motivo: 'sesion', message: 'Debes iniciar sesión para pagar.' }

  try {
    await eliminar('/carrito') // por si quedó algo de una compra anterior
    for (const item of items) {
      await post('/carrito/items', { idProducto: Number(item.codigo), cantidad: item.qty })
    }
    const boleta = await post('/boletas/checkout')

    const orden = ordenDesdeBoleta(boleta, { cliente, entrega, usuarioId })
    guardarOrden(orden)
    await sincronizarCatalogo() // el stock cambió: se actualiza lo que ve la tienda
    return { ok: true, orden }
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    const motivo = error.status === 409 ? 'stock' : error.status === 401 ? 'sesion' : 'api'
    return { ok: false, motivo, message: error.message }
  }
}
