/** Formatea un número como precio en pesos chilenos: 549990 -> $549.990 */
export function formatCLP(valor) {
  return '$' + Number(valor).toLocaleString('es-CL')
}

/** Fecha del backend (ISO) -> "20 NOV 2026". Si no es válida, devuelve el texto original. */
export function formatearFecha(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return String(valor)
  return fecha
    .toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace('.', '')
}
