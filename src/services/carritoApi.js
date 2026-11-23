import { eliminar, get, put } from './api'

// Carrito real del usuario autenticado. La tienda sigue usando localStorage como
// copia local; estas funciones traducen el CarritoResponse del backend a ese formato.

export function carritoDeApi(carrito) {
  return (carrito?.items ?? []).map((item) => ({ codigo: String(item.idProducto), qty: item.cantidad }))
}

/** GET /api/v1/carrito. */
export async function obtenerCarrito() {
  return carritoDeApi(await get('/carrito'))
}

/** PUT /api/v1/carrito/items/{idProducto}. */
export async function cambiarCantidad(idProducto, cantidad) {
  return carritoDeApi(await put(`/carrito/items/${idProducto}`, { cantidad }))
}

/** DELETE /api/v1/carrito/items/{idProducto}. */
export async function quitarItem(idProducto) {
  return carritoDeApi(await eliminar(`/carrito/items/${idProducto}`))
}
