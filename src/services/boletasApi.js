import { ROLES, STORAGE_KEYS } from '../data/constantes'
import { get, patch } from './api'
import { sincronizarCatalogo, traerTodasLasPaginas } from './catalogoApi'
import { ordenDesdeBoleta } from './compraApi'
import { obtenerOrdenes, obtenerOrdenPorId } from './ordenesService'

// Órdenes / boletas del panel de administración, leídas del backend.
//
// El backend guarda la boleta (usuario, fecha, total, estado y productos). Lo que NO
// guarda es el nombre del cliente ni los datos de entrega. Para completarlos:
//  - si la compra se hizo en este navegador, se usan los datos guardados en ese momento;
//  - si no, el Administrador los pide a GET /usuarios/{id} (el Vendedor no tiene permiso);
//  - lo que no se pueda saber queda como "Cliente #id" y "entrega no registrada".

const UMBRAL_PAGO_RECHAZADO = 1e12 // los pagos rechazados de la demo usan la hora como id

const ENTREGA_NO_REGISTRADA = {
  tipo: 'no-registrada',
  calle: '',
  departamento: '',
  region: '',
  comuna: '',
  indicaciones: '',
}

const clienteDesconocido = (idUsuario) => ({ nombre: 'Cliente', apellidos: `#${idUsuario}`, correo: '' })

function esAdministrador() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.sesion))?.tipo === ROLES.admin
  } catch {
    return false
  }
}

/** Nombre y correo de cada usuario que aparece en las boletas (solo lo puede pedir el Administrador). */
async function clientesPorUsuario(boletas) {
  const clientes = new Map()
  if (!esAdministrador()) return clientes
  const ids = [...new Set(boletas.map((b) => b.idUsuario))]
  await Promise.all(
    ids.map(async (id) => {
      try {
        const usuario = await get(`/usuarios/${id}`)
        clientes.set(id, { nombre: usuario.nombre, apellidos: usuario.apellidos, correo: usuario.correo })
      } catch {
        // sin permiso o usuario dado de baja: queda como "Cliente #id"
      }
    }),
  )
  return clientes
}

/** ¿La orden guardada en este navegador es la misma compra que esta boleta?
 * (Los ids antiguos de la demo local pueden coincidir con ids de boletas reales.) */
const mismaCompra = (local, boleta) =>
  Boolean(local) && local.total === boleta.total && local.items?.length === boleta.detalles.length

/**
 * Trae todas las boletas del backend y actualiza la copia local de las órdenes.
 * Se conservan los pagos rechazados de la demo (solo existen en el navegador).
 * Devuelve true si se pudo, false si falló (la copia local queda como estaba).
 */
export async function sincronizarBoletas() {
  try {
    const boletas = await traerTodasLasPaginas('/boletas')
    const previas = obtenerOrdenes()
    const clientes = await clientesPorUsuario(boletas)

    const desdeBackend = boletas.map((boleta) => {
      const previa = previas.find((o) => o.id === boleta.id)
      const local = mismaCompra(previa, boleta) ? previa : null
      return ordenDesdeBoleta(boleta, {
        cliente: local?.cliente ?? clientes.get(boleta.idUsuario) ?? clienteDesconocido(boleta.idUsuario),
        entrega: local?.entrega ?? ENTREGA_NO_REGISTRADA,
        usuarioId: boleta.idUsuario,
      })
    })
    const rechazadas = previas.filter((o) => o.estado === 'Fallida' && o.id > UMBRAL_PAGO_RECHAZADO)

    // De la más antigua a la más nueva (las pantallas la dan vuelta para mostrar la más nueva primero)
    const todas = [...desdeBackend, ...rechazadas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    localStorage.setItem(STORAGE_KEYS.ordenes, JSON.stringify(todas))
    return true
  } catch {
    return false
  }
}

/** GET /api/v1/boletas/mias: compras del usuario con sesión, convertidas a órdenes de la tienda. */
export async function listarMisBoletas() {
  const boletas = await traerTodasLasPaginas('/boletas/mias')
  const previas = obtenerOrdenes()
  return boletas.map((boleta) => {
    const local = previas.find((o) => o.id === boleta.id)
    return ordenDesdeBoleta(boleta, {
      cliente: local?.cliente ?? clienteDesconocido(boleta.idUsuario),
      entrega: local?.entrega ?? ENTREGA_NO_REGISTRADA,
      usuarioId: boleta.idUsuario,
    })
  })
}

/** GET /api/v1/boletas/{id}: detalle de una boleta. */
export function buscarBoleta(id) {
  return get(`/boletas/${id}`)
}

/** Anula una boleta (solo el Administrador): el backend devuelve el stock de sus productos.
 * Devuelve la orden ya actualizada. Si el backend lo rechaza lanza un ApiError con su mensaje. */
export async function anularBoleta(id) {
  const numero = Number(id)
  await patch(`/boletas/${numero}/anular`)
  await sincronizarBoletas()
  await sincronizarCatalogo() // el stock volvió
  return obtenerOrdenPorId(numero)
}
