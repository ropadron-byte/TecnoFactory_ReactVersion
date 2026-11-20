// Cliente HTTP del backend (Spring Boot). Todas las rutas van bajo /api/v1.
// Lo usan los servicios de productos, categorías, carrito y boletas.

// En desarrollo el backend corre en localhost:8080. Para apuntar a otro servidor,
// crea un archivo .env.local con VITE_API_URL=https://mi-servidor (ver .env.example).
export const API_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')
export const API_V1 = `${API_URL}/api/v1`

// El token JWT se guarda aparte de la sesión. Quien inicia sesión lo guarda con
// guardarToken() y cerrar sesión lo borra con borrarToken().
export const CLAVE_TOKEN = 'tf_token'

export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN)
export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token)
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN)

/** Error de una llamada al backend. status 0 = no hubo respuesta (servidor apagado o sin red). */
export class ApiError extends Error {
  constructor(status, mensaje, detalles = null) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.detalles = detalles
  }
}

// Mensajes para cuando el backend no manda uno propio (p. ej. un 401 sin cuerpo).
const MENSAJES_POR_ESTADO = {
  400: 'Los datos enviados no son válidos.',
  401: 'Debes iniciar sesión para continuar.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No se encontró lo que buscas.',
  409: 'La operación no se puede realizar en el estado actual.',
}

function mensajeDeError(status, cuerpo) {
  if (cuerpo && typeof cuerpo === 'object' && cuerpo.mensaje) return cuerpo.mensaje
  if (MENSAJES_POR_ESTADO[status]) return MENSAJES_POR_ESTADO[status]
  return status >= 500 ? 'Error interno del servidor. Inténtalo más tarde.' : 'No se pudo completar la solicitud.'
}

function armarUrl(ruta, params) {
  const consulta = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params ?? {})) {
    const valores = Array.isArray(valor) ? valor : [valor]
    valores.forEach((v) => {
      if (v !== undefined && v !== null && v !== '') consulta.append(clave, String(v))
    })
  }
  const texto = consulta.toString()
  const camino = ruta.startsWith('/') ? ruta : `/${ruta}`
  return `${API_V1}${camino}${texto ? `?${texto}` : ''}`
}

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text()
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return texto
  }
}

/**
 * Hace una llamada al backend y devuelve el cuerpo ya convertido (o null si no hay).
 *  - cuerpo:     objeto que se envía como JSON
 *  - params:     parámetros de la URL (?page=0&size=20); se omiten los vacíos
 *  - autenticar: si es false no se envía el token (rutas públicas)
 * Si el backend responde con error lanza un ApiError con su mensaje.
 */
export async function peticion(metodo, ruta, { cuerpo, params, autenticar = true } = {}) {
  const headers = { Accept: 'application/json' }
  const token = autenticar ? obtenerToken() : null
  if (token) headers.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta
  try {
    respuesta = await fetch(armarUrl(ruta, params), {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que el backend esté encendido.')
  }

  const datos = await leerCuerpo(respuesta)
  if (respuesta.ok) return datos

  // Un 401 con token significa que venció o ya no es válido: se descarta.
  if (respuesta.status === 401 && token) borrarToken()
  throw new ApiError(respuesta.status, mensajeDeError(respuesta.status, datos), datos?.detalles ?? null)
}

export const get = (ruta, opciones) => peticion('GET', ruta, opciones)
export const post = (ruta, cuerpo, opciones) => peticion('POST', ruta, { ...opciones, cuerpo })
export const put = (ruta, cuerpo, opciones) => peticion('PUT', ruta, { ...opciones, cuerpo })
export const patch = (ruta, cuerpo, opciones) => peticion('PATCH', ruta, { ...opciones, cuerpo })
export const eliminar = (ruta, opciones) => peticion('DELETE', ruta, opciones)
