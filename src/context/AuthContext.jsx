import { createContext, useContext, useState } from 'react'
import * as usuarios from '../services/usuariosService'
import * as auth from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => usuarios.obtenerSesion())

  /** Inicia sesión contra la API real y guarda el JWT en la sesión. */
  async function login(correo, contrasena) {
    const nueva = await auth.iniciarSesion(correo, contrasena)
    usuarios.guardarSesion(nueva)
    setSesion(nueva)
    return nueva
  }

  /**
   * Login con el ID token de Google.
   * Devuelve { requierePerfil: true, perfil } si la cuenta es nueva (202)
   * o { requierePerfil: false, sesion } si ya existía (200).
   */
  async function loginConGoogle(credential) {
    const respuesta = await auth.iniciarSesionGoogle(credential)
    if (respuesta?.requiereCompletarPerfil) {
      return { requierePerfil: true, perfil: respuesta }
    }
    const nueva = await auth.sesionDesdeAuth(respuesta)
    usuarios.guardarSesion(nueva)
    setSesion(nueva)
    return { requierePerfil: false, sesion: nueva }
  }

  /** Guarda una sesión ya construida (p. ej. tras completar el perfil de Google). */
  function guardarSesion(nueva) {
    usuarios.guardarSesion(nueva)
    setSesion(nueva)
    return nueva
  }

  /** Actualiza los datos personales del usuario con sesión y refresca el estado local. */
  async function actualizarPerfil(datos) {
    if (!sesion?.token) throw new Error('No hay una sesión activa para actualizar el perfil.')
    const nueva = await auth.actualizarPerfil(datos, sesion.token)
    usuarios.guardarSesion(nueva)
    setSesion(nueva)
    return nueva
  }

  /** Vincula la cuenta de Google con la sesión actual (requiere JWT). */
  async function vincularGoogle(credential) {
    if (!sesion?.token) throw new Error('No hay una sesión activa para vincular Google.')
    await auth.vincularGoogle(credential, sesion.token)
    return true
  }

  /** Vuelve a leer la sesión guardada (p. ej. tras editar al usuario actual). */
  function recargarSesion() {
    setSesion(usuarios.obtenerSesion())
  }

  function logout() {
    usuarios.cerrarSesion()
    setSesion(null)
  }

  const value = {
    sesion,
    login,
    loginConGoogle,
    logout,
    recargarSesion,
    guardarSesion,
    actualizarPerfil,
    vincularGoogle,
    esStaff: sesion?.tipo === 'Administrador' || sesion?.tipo === 'Vendedor',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
