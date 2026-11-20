import { API_URL } from '../services/api'

/**
 * El backend guarda las imágenes como "/uploads/...". Si se usan tal cual en un
 * <img>, el navegador las pide al servidor de Vite (puerto 5173) y recibe el
 * HTML del SPA en vez de la imagen. Esta función las apunta al backend.
 *
 * Las URLs absolutas (http/https, //, data:, blob:) se dejan intactas.
 */
export function urlImagen(url) {
  if (!url) return ''
  const valor = String(url)
  if (/^(?:https?:)?\/\//i.test(valor) || /^(data|blob):/i.test(valor)) return valor
  return `${API_URL}${valor.startsWith('/') ? '' : '/'}${valor}`
}
