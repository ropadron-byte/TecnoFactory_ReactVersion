// Catálogo de imágenes del backend (solo administradores y vendedores).
import { peticion } from './api'
import { obtenerSesion } from './usuariosService'

const token = () => obtenerSesion()?.token

/** GET /api/imagenes -> [{ id, url }] para elegir una imagen existente. */
export async function listarImagenes() {
  const respuesta = await peticion('/api/imagenes?size=1000', { token: token() })
  return (respuesta?.contenido ?? [])
    .filter((imagen) => imagen?.id && imagen?.url)
    .map((imagen) => ({ id: imagen.id, url: imagen.url }))
}
