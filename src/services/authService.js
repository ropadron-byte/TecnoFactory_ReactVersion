// Autenticación contra la API real de TecnoFactory (JWT + Google).
import { peticion } from './api'

// El backend usa roles en mayúsculas; la interfaz usa los nombres de siempre.
const TIPOS = {
  ADMINISTRADOR: 'Administrador',
  VENDEDOR: 'Vendedor',
  CLIENTE: 'Cliente',
}

export function tipoDeRol(rol) {
  return TIPOS[String(rol ?? '').toUpperCase()] ?? 'Cliente'
}

/** Convierte el UsuarioResponse del backend al formato de sesión del frontend. */
export function aSesion(usuario, token) {
  return {
    token,
    origen: 'api',
    id: usuario.id,
    run: String(usuario.run ?? ''),
    runDv: usuario.runDv ?? '',
    nombre: usuario.nombre ?? '',
    apellidos: usuario.apellidos ?? '',
    correo: usuario.correo ?? '',
    fecha_nacimiento: usuario.fechaNacimiento ?? '',
    direccion: usuario.direccion ?? '',
    telefono: usuario.telefono ?? '',
    comuna: usuario.comuna ?? '',
    region: usuario.region ?? '',
    tipo: tipoDeRol(usuario.tipoUsuario),
    activo: usuario.activo !== false,
  }
}

/** Con un JWT recién emitido, pide /api/v1/usuarios/me y arma la sesión completa. */
async function sesionConToken(auth) {
  const usuario = await peticion('/api/v1/usuarios/me', { token: auth.token })
  return aSesion(usuario, auth.token)
}

/** A partir de una AuthResponse (token + rol), arma la sesión completa. */
export async function sesionDesdeAuth(auth) {
  return sesionConToken(auth)
}

/** POST /api/v1/auth/login -> sesión lista para guardar. */
export async function iniciarSesion(correo, clave) {
  const auth = await peticion('/api/v1/auth/login', { metodo: 'POST', cuerpo: { correo, clave } })
  return sesionConToken(auth)
}

/** POST /api/v1/usuarios -> crea la cuenta (rol CLIENTE). */
export async function registrar(datos) {
  return peticion('/api/v1/usuarios', { metodo: 'POST', cuerpo: datos })
}

/**
 * POST /api/v1/auth/google.
 * Devuelve la AuthResponse (200) o la respuesta de perfil pendiente (202).
 */
export async function iniciarSesionGoogle(credential) {
  return peticion('/api/v1/auth/google', { metodo: 'POST', cuerpo: { credential } })
}

/** POST /api/v1/auth/google/completar -> crea la cuenta y devuelve la sesión. */
export async function completarPerfilGoogle(datos) {
  const auth = await peticion('/api/v1/auth/google/completar', { metodo: 'POST', cuerpo: datos })
  return sesionConToken(auth)
}

/** PUT /api/v1/usuarios/me -> actualiza los datos personales y devuelve la sesión renovada. */
export async function actualizarPerfil(datos, token) {
  const usuario = await peticion('/api/v1/usuarios/me', { metodo: 'PUT', cuerpo: datos, token })
  return aSesion(usuario, token)
}

/** PATCH /api/v1/usuarios/me/desactivar -> baja lógica de la propia cuenta. */
export function desactivarMiCuenta(token) {
  return peticion('/api/v1/usuarios/me/desactivar', { metodo: 'PATCH', token })
}

/** POST /api/v1/auth/google/vincular -> vincula Google a la cuenta con sesión. */
export async function vincularGoogle(credential, token) {
  return peticion('/api/v1/auth/google/vincular', {
    metodo: 'POST',
    cuerpo: { credential },
    token,
  })
}
