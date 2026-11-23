// Cliente HTTP del backend (Spring Boot).
// Compatible con dos formas de llamar, ambas bajo el prefijo /api/v1 del backend:
//  - peticion(ruta, { metodo, cuerpo, token, signal })      -> ruta /api/v1/... completa
//  - peticion(metodo, ruta, { cuerpo, params, autenticar }) -> ruta relativa a /api/v1
// La URL se configura con VITE_API_URL (por defecto, el backend local).

import { STORAGE_KEYS } from '../data/constantes'

export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')
export const API_V1 = `${API_URL}/api/v1`

/** Error de una llamada al backend. status 0 = no hubo respuesta. */
export class ApiError extends Error {
  constructor(status, mensaje, detalles = null) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.mensaje = mensaje
    this.detalles = detalles
  }
}

// Token JWT en localStorage (lo usan las rutas /api/v1 y el catálogo).
export const CLAVE_TOKEN = 'tf_token'
export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN)
export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token)
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN)

// El login guarda el JWT dentro de la sesión (tf_sesion). Las rutas del estilo /api/v1
// (catálogo, carrito, boletas) usan ese token; si no hay sesión, el guardado aparte.
function tokenDeSesion() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.sesion))?.token ?? null
  } catch {
    return null
  }
}
export const tokenActual = () => tokenDeSesion() ?? obtenerToken()

// Mensajes para el estilo directo (tus servicios de blogs/usuarios/imágenes/auth).
const MENSAJES = {
  400: 'Revisa los datos enviados.',
  401: 'Correo o contraseña incorrectos.',
  403: 'No tienes permisos para esta acción.',
  404: 'No encontramos lo que buscabas.',
  409: 'Ese dato ya está registrado.',
  500: 'Ocurrió un error en el servidor.',
}

// Mensajes para el estilo /api/v1 (catálogo de tu compañero).
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
  return status >= 500
    ? 'Error interno del servidor. Inténtalo más tarde.'
    : 'No se pudo completar la solicitud.'
}

// ---------- estilo /api/v1 (catálogo) ----------

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

async function peticionV1(metodo, ruta, { cuerpo, params, autenticar = true } = {}) {
  const headers = { Accept: 'application/json' }
  const token = autenticar ? tokenActual() : null
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
    throw new ApiError(0, 'No se pudo completar la solicitud. Inténtalo de nuevo.')
  }

  const datos = await leerCuerpo(respuesta)
  if (respuesta.ok) return datos

  // Un 401 con token significa que venció: se descarta.
  if (respuesta.status === 401 && token) borrarToken()
  throw new ApiError(respuesta.status, mensajeDeError(respuesta.status, datos), datos?.detalles ?? null)
}

export const get = (ruta, opciones) => peticionV1('GET', ruta, opciones)
export const post = (ruta, cuerpo, opciones) => peticionV1('POST', ruta, { ...opciones, cuerpo })
export const put = (ruta, cuerpo, opciones) => peticionV1('PUT', ruta, { ...opciones, cuerpo })
export const patch = (ruta, cuerpo, opciones) => peticionV1('PATCH', ruta, { ...opciones, cuerpo })
export const eliminar = (ruta, opciones) => peticionV1('DELETE', ruta, opciones)

// ---------- estilo directo (tus rutas /api/v1/...) ----------

async function leerRespuesta(respuesta) {
  if (respuesta.status === 204) return null

  const texto = await respuesta.text()
  let datos = null
  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch {
      datos = null
    }
  }

  if (!respuesta.ok) {
    throw new ApiError(
      respuesta.status,
      datos?.mensaje || MENSAJES[respuesta.status] || `Error ${respuesta.status}.`,
      datos?.detalles,
    )
  }

  return datos
}

function errorDeRed() {
  return new ApiError(0, 'No se pudo completar la solicitud. Inténtalo de nuevo.')
}

async function peticionDirecta(ruta, { metodo = 'GET', cuerpo, token, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  const tokenFinal = token ?? obtenerToken()
  if (tokenFinal) headers.Authorization = `Bearer ${tokenFinal}`

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw errorDeRed()
  }

  return leerRespuesta(respuesta)
}

/** Sube archivos. No fija Content-Type: FormData agrega el boundary. */
export async function peticionFormData(ruta, { metodo = 'POST', formData, token, signal } = {}) {
  const headers = { Accept: 'application/json' }
  const tokenFinal = token ?? obtenerToken()
  if (tokenFinal) headers.Authorization = `Bearer ${tokenFinal}`

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: formData,
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw errorDeRed()
  }

  return leerRespuesta(respuesta)
}

const METODOS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

/** Compatible con las dos formas usadas en el proyecto. */
export async function peticion(rutaOMetodo, rutaUOpciones = {}, opcionesV1 = {}) {
  if (METODOS.has(rutaOMetodo) && typeof rutaUOpciones === 'string') {
    return peticionV1(rutaOMetodo, rutaUOpciones, opcionesV1)
  }
  return peticionDirecta(rutaOMetodo, rutaUOpciones)
}
