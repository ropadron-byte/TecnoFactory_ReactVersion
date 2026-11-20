// Funciones puras para precios y ofertas. El descuento es un porcentaje
// (0 a 100) guardado en el producto; si no existe, el producto no está en oferta.

export function descuentoDe(producto) {
  const d = Number(producto?.descuento)
  if (Number.isNaN(d)) return 0
  return Math.min(100, Math.max(0, d))
}

export const tieneOferta = (producto) => descuentoDe(producto) > 0

/** Precio que efectivamente paga el cliente (con el descuento aplicado). */
export function precioFinal(producto) {
  // Mismo cálculo que el backend (multiplicar primero, dividir después): con decimales
  // (1 - d/100) algunos precios se redondeaban $1 distinto al de la boleta.
  return Math.round((producto.precio * (100 - descuentoDe(producto))) / 100)
}
