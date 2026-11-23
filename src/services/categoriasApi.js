import { ApiError, eliminar, post, put } from './api'
import { categoriaDesdeApi, sincronizarCatalogo } from './catalogoApi'

// Gestión de categorías del panel de administración contra el backend.
// Igual que en productosApi: se pide el cambio al backend (con el JWT de la sesión) y
// después se vuelve a sincronizar el catálogo. Si el backend lo rechaza (nombre repetido,
// categoría con productos, falta de permiso), se lanza un ApiError con su mensaje.

function idDe(id) {
  const numero = Number(id)
  if (!Number.isInteger(numero)) throw new ApiError(404, 'Categoría no encontrada.')
  return numero
}

/** Categoría del formulario -> cuerpo de POST/PUT /categorias (la imagen pasa a lista de URLs). */
function aSolicitud({ nombre, descripcion, imagen }) {
  return { nombre, descripcion, imagenes: imagen ? [imagen] : [] }
}

export async function crearCategoria(datos) {
  const creada = await post('/categorias', aSolicitud(datos))
  await sincronizarCatalogo()
  return categoriaDesdeApi(creada)
}

/** Si cambia el nombre, los productos de la categoría pasan a mostrarlo solos: se relee el catálogo. */
export async function editarCategoria(id, datos) {
  const editada = await put(`/categorias/${idDe(id)}`, aSolicitud(datos))
  await sincronizarCatalogo()
  return categoriaDesdeApi(editada)
}

/** El backend solo la elimina si ningún producto (ni uno desactivado) la usa. */
export async function borrarCategoria(id) {
  await eliminar(`/categorias/${idDe(id)}`)
  await sincronizarCatalogo()
}
