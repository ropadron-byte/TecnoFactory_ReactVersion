// Adaptador entre los DTO de blogs del backend y lo que esperan las vistas.
// La lectura pública funciona sin sesión; la gestión siempre envía el JWT.
import { peticion, peticionFormData } from './api'
import { obtenerSesion } from './usuariosService'

const token = () => obtenerSesion()?.token

function deImagen(dto) {
  return dto ? { id: dto.id, url: dto.url ?? '' } : null
}

/** BlogResumenResponse -> tarjeta del listado público. */
export function deResumen(b) {
  return {
    id: b.id,
    titulo: b.titulo ?? '',
    fechaCreacion: b.fechaCreacion ?? '',
    imagenPrincipal: deImagen(b.imagenPrincipal),
  }
}

/** BlogPublicoResponse -> artículo completo (sin datos del autor). */
export function dePublico(b) {
  return {
    ...deResumen(b),
    contenido: b.contenido ?? '',
    imagenes: (b.imagenes ?? []).map(deImagen).filter(Boolean),
  }
}

/** BlogGestionResponse -> fila del panel. */
export function deGestion(b) {
  return {
    ...deResumen(b),
    visible: b.visible !== false,
    autorNombre: b.autorNombre ?? '',
  }
}

/** BlogResponse -> detalle de gestión (incluye autor e imágenes). */
export function deDetalleGestion(b) {
  return {
    ...dePublico(b),
    visible: b.visible !== false,
    autorId: b.autorId ?? null,
    autorNombre: b.autorNombre ?? '',
    autorCorreo: b.autorCorreo ?? '',
  }
}

function cuerpoBlog(datos) {
  const cuerpo = {
    titulo: (datos.titulo ?? '').trim(),
    contenido: datos.contenido ?? '',
  }
  if (datos.visible !== undefined) cuerpo.visible = datos.visible
  if (datos.idImagenPrincipal) cuerpo.idImagenPrincipal = datos.idImagenPrincipal
  return cuerpo
}

// ---------- Lectura pública ----------

/** GET /api/v1/blogs. El panel pide suficientes elementos para mostrar la tabla completa. */
export async function listarBlogs() {
  const respuesta = await peticion('/api/v1/blogs?size=1000', { token: token() })
  return (respuesta?.contenido ?? []).map(deResumen)
}

/** GET /api/v1/blogs/{id}. Con JWT, el personal también ve los blogs desactivados. */
export async function buscarBlog(id) {
  return dePublico(await peticion(`/api/v1/blogs/${id}`, { token: token() }))
}

/** GET /api/v1/blogs/{id}/imagen: portada del blog (204 si no tiene). */
export async function imagenPrincipalBlog(id) {
  return deImagen(await peticion(`/api/v1/blogs/${id}/imagen`, { token: token() }))
}

/** GET /api/v1/blogs/{id}/imagenes. */
export async function listarImagenesBlog(id) {
  const imagenes = await peticion(`/api/v1/blogs/${id}/imagenes`, { token: token() })
  return (imagenes ?? []).map(deImagen).filter(Boolean)
}

// ---------- Gestión (admin o vendedor) ----------

export async function listarBlogsGestion() {
  const respuesta = await peticion('/api/v1/blogs/gestion?size=1000', { token: token() })
  return (respuesta?.contenido ?? []).map(deGestion)
}

export async function buscarBlogGestion(id) {
  return deDetalleGestion(await peticion(`/api/v1/blogs/gestion/${id}`, { token: token() }))
}

export async function crearBlog(datos) {
  return deDetalleGestion(await peticion('/api/v1/blogs', {
    metodo: 'POST',
    cuerpo: cuerpoBlog(datos),
    token: token(),
  }))
}

export async function actualizarBlog(id, datos) {
  return deDetalleGestion(await peticion(`/api/v1/blogs/${id}`, {
    metodo: 'PUT',
    cuerpo: cuerpoBlog(datos),
    token: token(),
  }))
}

export async function activarBlog(id) {
  return deDetalleGestion(await peticion(`/api/v1/blogs/${id}/activar`, {
    metodo: 'PATCH',
    token: token(),
  }))
}

export async function desactivarBlog(id) {
  return deDetalleGestion(await peticion(`/api/v1/blogs/${id}/desactivar`, {
    metodo: 'PATCH',
    token: token(),
  }))
}

export async function eliminarBlog(id) {
  await peticion(`/api/v1/blogs/${id}`, { metodo: 'DELETE', token: token() })
}

// ---------- Galería y portada ----------

/** Sube un archivo y lo agrega a la galería del blog. */
export async function subirImagenBlog(id, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  return deImagen(await peticionFormData(`/api/v1/blogs/${id}/imagenes`, {
    formData,
    token: token(),
  }))
}

/** Agrega a la galería una imagen ya registrada en el catálogo. */
export async function agregarImagenExistente(id, idImagen) {
  return deImagen(await peticion(`/api/v1/blogs/${id}/imagenes/${idImagen}`, {
    metodo: 'POST',
    token: token(),
  }))
}

/** Fija una imagen de la galería como portada. */
export async function cambiarPortada(id, idImagen) {
  return deDetalleGestion(await peticion(`/api/v1/blogs/${id}/imagen-principal/${idImagen}`, {
    metodo: 'PUT',
    token: token(),
  }))
}

/** Quita una imagen de la galería (si era portada, el blog queda sin portada). */
export async function quitarImagen(id, idImagen) {
  return deImagen(await peticion(`/api/v1/blogs/${id}/imagenes/${idImagen}`, {
    metodo: 'DELETE',
    token: token(),
  }))
}
