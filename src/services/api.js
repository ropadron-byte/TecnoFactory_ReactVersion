// Cliente HTTP mínimo para hablar con la API de Spring Boot.
// La URL se configura con VITE_API_URL (por defecto, el backend local).

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')

export const API_URL = BASE

/** Error de la API: conserva el status HTTP y los detalles de validación. */
export class ApiError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.mensaje = mensaje
    this.detalles = detalles ?? null
  }
}

const MENSAJES = {
  400: 'Revisa los datos enviados.',
  401: 'Correo o contraseña incorrectos.',
  403: 'No tienes permisos para esta acción.',
  404: 'No encontramos lo que buscabas.',
  409: 'Ese dato ya está registrado.',
  500: 'Ocurrió un error en el servidor.',
}

function errorDeRed() {
  return new ApiError(
    0,
    `No se pudo conectar con el servidor (${BASE}). Verifica que el backend esté corriendo.`,
  )
}

/** Interpreta la respuesta compartida por las peticiones JSON y multipart. */
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

/**
 * Hace una petición JSON a la API y devuelve el JSON de la respuesta.
 * Lanza `ApiError` si la respuesta no es 2xx (salvo 204, que devuelve null).
 */
export async function peticion(ruta, { metodo = 'GET', cuerpo, token, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
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

/**
 * Petición multipart para subir archivos. No se fija Content-Type: el navegador
 * debe agregar el boundary de FormData. El backend devuelve JSON (o 204).
 */
export async function peticionFormData(ruta, { metodo = 'POST', formData, token, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
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
