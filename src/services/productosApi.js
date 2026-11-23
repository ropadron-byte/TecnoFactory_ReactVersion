import { ApiError, eliminar, get, patch, post, put } from './api'
import { productoDesdeApi, sincronizarCatalogo, traerTodasLasPaginas } from './catalogoApi'
import { obtenerCategorias } from './categoriasService'

// Gestión de productos del panel de administración contra el backend.
// Las tres operaciones piden el cambio al backend (con el JWT de la sesión) y después
// vuelven a sincronizar el catálogo, para que la tienda muestre lo que quedó guardado.
// Si el backend rechaza el cambio, lanzan un ApiError con su mensaje y no tocan la copia local.

/** Código de la tienda -> id del backend. Un código que no es numérico no existe allá. */
function idDe(codigo) {
  const id = Number(codigo)
  if (!Number.isInteger(id)) throw new ApiError(404, 'Producto no encontrado.')
  return id
}

/** Producto del formulario -> cuerpo de POST/PUT /productos.
 * La tienda maneja una categoría por producto; el backend pide los ids de las categorías. */
function aSolicitud(datos) {
  const categoria = obtenerCategorias().find((c) => c.nombre === datos.categoria)
  if (!categoria) throw new ApiError(400, 'La categoría seleccionada no existe.')
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precio: datos.precio,
    stock: datos.stock,
    stockCritico: datos.stockCritico,
    descuento: datos.descuento,
    categoriaIds: [categoria.id],
    imagenes: datos.urls ?? [],
  }
}

/** GET /api/v1/productos/ofertas: catálogo de ofertas para la tienda. */
export async function listarOfertas() {
  const productos = await traerTodasLasPaginas('/productos/ofertas')
  return productos.map(productoDesdeApi)
}

/** GET /api/v1/productos/admin: catálogo completo del panel, incluidos los desactivados. */
export async function listarProductosAdmin() {
  const productos = await traerTodasLasPaginas('/productos/admin')
  return productos.map(productoDesdeApi)
}

/** GET /api/v1/productos/criticos: productos en umbral crítico (lista sin paginar). */
export async function listarProductosCriticos() {
  const productos = await get('/productos/criticos')
  return (productos ?? []).map(productoDesdeApi)
}

/** GET /api/v1/productos/{id}: detalle de un producto. */
export async function buscarProducto(id) {
  return productoDesdeApi(await get(`/productos/${idDe(id)}`))
}

/** PATCH /api/v1/productos/{id}/activar: vuelve a publicar un producto desactivado. */
export async function activarProducto(id) {
  const activado = await patch(`/productos/${idDe(id)}/activar`)
  await sincronizarCatalogo()
  return productoDesdeApi(activado)
}

/** Crea un producto y devuelve el producto guardado (con el código que le dio el backend). */
export async function crearProducto(datos) {
  const creado = await post('/productos', aSolicitud(datos))
  await sincronizarCatalogo()
  return productoDesdeApi(creado)
}

/** Edita un producto existente. El código no cambia. */
export async function editarProducto(codigo, datos) {
  const id = idDe(codigo)
  const editado = await put(`/productos/${id}`, aSolicitud(datos))
  await sincronizarCatalogo()
  return productoDesdeApi(editado)
}

/** "Eliminar" desactiva el producto: deja de mostrarse en la tienda, pero las boletas
 * antiguas conservan su nombre, precio y descuento. */
export async function desactivarProducto(codigo) {
  await eliminar(`/productos/${idDe(codigo)}`)
  await sincronizarCatalogo()
}
