// Adaptador entre el formato del panel (localStorage) y la API de usuarios.
// La sesión con el JWT sigue viviendo en usuariosService; acá solo se habla con el backend.
import { peticion } from './api'
import { obtenerSesion } from './usuariosService'
import { ROLES } from '../data/constantes'
import { idComunaDe } from '../data/comunas'
import { REGIONES } from '../data/regiones'
import { separarRun } from '../utils/validaciones'

const ROLES_API = {
  ADMINISTRADOR: ROLES.admin,
  VENDEDOR: ROLES.vendedor,
  CLIENTE: ROLES.cliente,
}

const ROLES_FRONT = {
  [ROLES.admin]: 'ADMINISTRADOR',
  [ROLES.vendedor]: 'VENDEDOR',
  [ROLES.cliente]: 'CLIENTE',
}

function rolFront(rolApi) {
  return ROLES_API[String(rolApi ?? '').toUpperCase()] ?? ROLES.cliente
}

// El backend devuelve "Metropolitana"; el panel usa "Región Metropolitana".
function regionDeComuna(comuna) {
  return REGIONES.find((r) => r.comunas.includes(comuna))?.region ?? ''
}

const token = () => obtenerSesion()?.token

/** UsuarioResponse del backend -> objeto que esperan las vistas del panel. */
export function deApi(u) {
  return {
    id: u.id,
    run: `${u.run ?? ''}${u.runDv ?? ''}`,
    runDv: u.runDv ?? '',
    nombre: u.nombre ?? '',
    apellidos: u.apellidos ?? '',
    correo: u.correo ?? '',
    contrasena: '',
    fecha_nacimiento: u.fechaNacimiento ?? '',
    telefono: u.telefono ?? '',
    tipo: rolFront(u.tipoUsuario),
    region: regionDeComuna(u.comuna),
    comuna: u.comuna ?? '',
    direccion: u.direccion ?? '',
    activo: u.activo !== false,
  }
}

/** Datos del formulario -> UsuarioRequest / UsuarioActualizarRequest. */
function aApi(datos) {
  const { run, runDv } = separarRun(datos.run)
  return {
    run,
    runDv,
    nombre: datos.nombre.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim(),
    fechaNacimiento: datos.fecha_nacimiento,
    telefono: (datos.telefono ?? '').trim(),
    direccion: datos.direccion.trim(),
    idComuna: idComunaDe(datos.comuna),
  }
}

/** GET /api/usuarios (paginado). El panel pide suficientes elementos para mostrar la tabla completa. */
export async function listarUsuarios() {
  const respuesta = await peticion('/api/usuarios?size=1000', { token: token() })
  return (respuesta?.contenido ?? []).map(deApi)
}

export async function buscarUsuario(id) {
  return deApi(await peticion(`/api/usuarios/${id}`, { token: token() }))
}

/** Crea VENDEDOR o CLIENTE según el tipo elegido. No se pueden crear administradores. */
export async function crearUsuario(datos) {
  const cuerpo = { ...aApi(datos), clave: datos.contrasena }
  const ruta = datos.tipo === ROLES.vendedor ? '/api/usuarios/vendedores' : '/api/usuarios'
  return deApi(await peticion(ruta, { metodo: 'POST', cuerpo, token: token() }))
}

/** La clave vacía se omite: el backend conserva la actual. */
export async function actualizarUsuario(id, datos) {
  const cuerpo = {
    ...aApi(datos),
    activo: datos.activo ?? undefined,
    ...(datos.contrasena ? { clave: datos.contrasena } : {}),
  }
  return deApi(await peticion(`/api/usuarios/${id}`, { metodo: 'PUT', cuerpo, token: token() }))
}

export async function desactivarUsuario(id) {
  return deApi(await peticion(`/api/usuarios/${id}/desactivar`, { metodo: 'PATCH', token: token() }))
}

export async function eliminarUsuario(id) {
  await peticion(`/api/usuarios/${id}`, { metodo: 'DELETE', token: token() })
}

export { ROLES_FRONT, rolFront }
