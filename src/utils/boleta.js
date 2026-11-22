import { formatCLP } from './formato'

function textoEntrega(entrega) {
  if (entrega.tipo === 'retiro') return 'Entrega: Retiro en tienda'
  if (entrega.tipo === 'no-registrada') return 'Entrega: sin datos registrados'
  return `Entrega: ${entrega.calle}${entrega.departamento ? ', ' + entrega.departamento : ''}, ${entrega.comuna}, ${entrega.region}`
}

/** Texto plano de la boleta (para el cuerpo del correo). */
export function textoBoleta(orden) {
  const lineas = [
    `Boleta de compra N° ${orden.numero} (${orden.codigo})`,
    `Fecha: ${new Date(orden.fecha).toLocaleString('es-CL')}`,
    '',
    `Cliente: ${orden.cliente.nombre} ${orden.cliente.apellidos}`,
    textoEntrega(orden.entrega),
    '',
    'Detalle:',
    ...orden.items.map((i) => `- ${i.nombre} x${i.qty}: ${formatCLP(i.subtotal)}`),
    '',
    `Total ${orden.estado === 'Anulada' ? 'anulado' : 'pagado'}: ${formatCLP(orden.total)}`,
    '',
    'Gracias por comprar en Tecno Factory.',
  ]
  return lineas.join('\n')
}

/** Enlace mailto: que abre el correo del usuario con la boleta ya escrita. */
export function mailtoBoleta(orden) {
  const asunto = `Boleta de compra N° ${orden.numero} - Tecno Factory`
  // El correo ya fue validado en el checkout, por eso va tal cual.
  return `mailto:${orden.cliente.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(textoBoleta(orden))}`
}
