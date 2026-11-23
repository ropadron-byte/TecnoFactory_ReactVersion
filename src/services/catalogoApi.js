import { STORAGE_KEYS } from '../data/constantes'
import { get } from './api'

// Catálogo (categorías y productos) que viene del backend.
//
// Las vistas leen el catálogo de forma síncrona desde localStorage
// (productosService / categoriasService). Para no reescribirlas, el backend manda y
// localStorage hace de copia local: sincronizarCatalogo() trae los datos y los guarda
// en la misma forma que ya esperaban las vistas.

const TAMANIO_PAGINA = 100
const MAX_PAGINAS = 50 // tope de seguridad contra un bucle infinito

/** Producto del backend -> producto de la tienda.
 * El "codigo" es el id numérico del backend (como texto), así las URLs quedan /productos/17.
 * La tienda maneja una sola categoría por producto: se usa la primera. */
export function productoDesdeApi(p) {
  return {
    id: p.id,
    codigo: String(p.id),
    nombre: p.nombre,
    categoria: p.categorias?.[0]?.nombre ?? '',
    descripcion: p.descripcion ?? '',
    precio: p.precio,
    stock: p.stock,
    stockCritico: p.stockCritico,
    descuento: p.descuento ?? 0,
    activo: p.activo !== false,
    urls: p.imagenes ?? [],
  }
}

/** Categoría del backend -> categoría de la tienda (usa la primera imagen como portada). */
export function categoriaDesdeApi(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion ?? '',
    imagen: c.imagenes?.[0] ?? '',
  }
}

/** Recorre todas las páginas de un listado paginado del backend y junta su contenido. */
export async function traerTodasLasPaginas(ruta, opciones) {
  const todos = []
  let pagina = 0
  let totalPaginas = 1
  while (pagina < totalPaginas && pagina < MAX_PAGINAS) {
    const respuesta = await get(ruta, { ...opciones, params: { page: pagina, size: TAMANIO_PAGINA } })
    todos.push(...respuesta.contenido)
    totalPaginas = respuesta.totalPaginas
    pagina++
  }
  return todos
}

/** Trae categorías y productos activos del backend y actualiza la copia local.
 * Devuelve true si se pudo, o false si falló (en ese caso la copia local queda como estaba). */
export async function sincronizarCatalogo() {
  try {
    // Rutas públicas: no se envía el token (uno vencido haría fallar la consulta).
    const [categorias, productos] = await Promise.all([
      get('/categorias', { autenticar: false }),
      traerTodasLasPaginas('/productos', { autenticar: false }),
    ])
    localStorage.setItem(STORAGE_KEYS.categorias, JSON.stringify(categorias.map(categoriaDesdeApi)))
    localStorage.setItem(STORAGE_KEYS.productos, JSON.stringify(productos.map(productoDesdeApi)))
    return true
  } catch {
    return false
  }
}
