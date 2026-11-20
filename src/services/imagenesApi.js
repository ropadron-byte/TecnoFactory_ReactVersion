// Catálogo de imágenes del backend (administradores y vendedores).
// Mantiene los dueños de cada imagen para poder gestionar sus relaciones.
import { peticion, peticionFormData } from './api'
import { obtenerSesion } from './usuariosService'

const token = () => obtenerSesion()?.token

/** ImagenResponse -> imagen del panel, con la lista de dueños (BLOG/PRODUCTO/CATEGORIA). */
function deImagen(dto) {
  if (!dto?.id || !dto?.url) return null
  return {
    id: dto.id,
    url: dto.url,
    duenos: (dto.duenos ?? []).map((dueno) => ({ tipo: dueno.tipo ?? '', id: dueno.id ?? null })),
  }
}

function formularioArchivo(archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  return formData
}

// ---------- Lectura ----------

/** GET /api/imagenes?size=1000 -> [{ id, url, duenos }]. */
export async function listarImagenes() {
  const respuesta = await peticion('/api/imagenes?size=1000', { token: token() })
  return (respuesta?.contenido ?? []).map(deImagen).filter(Boolean)
}

/** GET /api/imagenes/{id}. */
export async function buscarImagen(id) {
  return deImagen(await peticion(`/api/imagenes/${id}`, { token: token() }))
}

// ---------- Archivo ----------

/**
 * Sube una imagen sin dueño. `destino` elige la carpeta del servidor:
 * 'general' (POST /api/imagenes) o 'productos' (POST /api/imagenes/productos).
 */
export async function subirImagen(archivo, destino = 'general') {
  const ruta = destino === 'productos' ? '/api/imagenes/productos' : '/api/imagenes'
  return deImagen(await peticionFormData(ruta, {
    formData: formularioArchivo(archivo),
    token: token(),
  }))
}

/** PUT /api/imagenes/{id}: conserva el id y todas las relaciones. */
export async function reemplazarImagen(id, archivo) {
  return deImagen(await peticionFormData(`/api/imagenes/${id}`, {
    metodo: 'PUT',
    formData: formularioArchivo(archivo),
    token: token(),
  }))
}

/** DELETE /api/imagenes/{id}. El backend responde 409 si todavía tiene dueños. */
export async function eliminarImagen(id) {
  await peticion(`/api/imagenes/${id}`, { metodo: 'DELETE', token: token() })
}

// ---------- Relaciones ----------

/** DELETE /api/imagenes/{id}/duenos: deja la imagen libre, sin borrarla. */
export async function desacoplarImagenDeTodos(id) {
  return deImagen(await peticion(`/api/imagenes/${id}/duenos`, {
    metodo: 'DELETE',
    token: token(),
  }))
}

/** DELETE /api/imagenes/{id}/duenos/{tipo}/{idDueno}. */
export async function desacoplarImagenDe(id, tipo, idDueno) {
  return deImagen(await peticion(`/api/imagenes/${id}/duenos/${tipo}/${idDueno}`, {
    metodo: 'DELETE',
    token: token(),
  }))
}
