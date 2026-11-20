import { useEffect, useState } from 'react'
import { listarUsuarios } from '../services/usuariosApi'

/** Lista de usuarios desde el backend, para las métricas del panel. */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    let activo = true
    listarUsuarios()
      .then((datos) => activo && setUsuarios(datos))
      .catch(() => activo && setUsuarios([]))
    return () => {
      activo = false
    }
  }, [])

  return usuarios
}
