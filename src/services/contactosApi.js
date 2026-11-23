import { ApiError, get, post } from './api'
import { traerTodasLasPaginas } from './catalogoApi'

// Mensajes del formulario público. Solo el administrador puede leerlos.

/** POST /api/v1/contactos: guarda el mensaje enviado desde la tienda. */
export function enviarContacto(datos) {
  return post('/contactos', datos)
}

/** GET /api/v1/contactos: recorre todas las páginas para el panel. */
export function listarContactos() {
  return traerTodasLasPaginas('/contactos')
}

/** GET /api/v1/contactos/{id}: detalle de un mensaje. */
export function buscarContacto(id) {
  const numero = Number(id)
  if (!Number.isInteger(numero)) throw new ApiError(404, 'Mensaje no encontrado.')
  return get(`/contactos/${numero}`)
}
