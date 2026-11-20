import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLES } from '../../data/constantes'
import { ApiError } from '../../services/api'
import { desactivarUsuario, eliminarUsuario, listarUsuarios } from '../../services/usuariosApi'
import usePageTitle from '../../hooks/usePageTitle'
import EstadoForm from '../../components/EstadoForm.jsx'

export default function AdminUsuarios() {
  usePageTitle('Usuarios', 'Panel Tecno Factory')
  const { sesion } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState(null)

  async function cargar() {
    try {
      setUsuarios(await listarUsuarios())
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message ?? 'No se pudo cargar la lista de usuarios.' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let activo = true
    listarUsuarios()
      .then((datos) => activo && setUsuarios(datos))
      .catch((error) => activo && setAviso({ tipo: 'error', texto: error.message ?? 'No se pudo cargar la lista de usuarios.' }))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  async function desactivar(u) {
    if (!window.confirm(`¿Desactivar al vendedor "${u.nombre} ${u.apellidos}"? Perderá el acceso al instante.`)) return
    try {
      await desactivarUsuario(u.id)
      setAviso({ tipo: 'success', texto: 'Vendedor desactivado.' })
      await cargar()
    } catch (error) {
      setAviso({ tipo: 'error', texto: error instanceof ApiError ? error.mensaje : 'No se pudo desactivar el vendedor.' })
    }
  }

  async function eliminar(u) {
    if (!window.confirm(`¿Eliminar al vendedor "${u.nombre} ${u.apellidos}"? Esta acción no se puede deshacer.`)) return
    try {
      await eliminarUsuario(u.id)
      setAviso({ tipo: 'success', texto: 'Vendedor eliminado.' })
      await cargar()
    } catch (error) {
      setAviso({ tipo: 'error', texto: error instanceof ApiError ? error.mensaje : 'No se pudo eliminar el vendedor.' })
    }
  }

  return (
    <>
      <AdminHeader titulo="Usuarios" />

      <section>
        <p>
          <Link className="btn btn-warning btn-sm" to="/admin/usuarios/nuevo">
            + Nuevo usuario
          </Link>
        </p>

        <EstadoForm estado={aviso} className="mb-3" />

        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>RUN</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Tipo</th>
                <th>Comuna</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6}>Cargando usuarios desde el servidor...</td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6}>Aún no hay usuarios registrados.</td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const esVendedor = u.tipo === ROLES.vendedor
                  const esPropio = sesion?.id === u.id
                  return (
                    <tr key={u.id}>
                      <td>{u.run}</td>
                      <td>
                        {u.nombre} {u.apellidos}
                        {!u.activo && <span className="badge text-bg-light ms-2">Inactivo</span>}
                      </td>
                      <td>{u.correo}</td>
                      <td>
                        <span className={'badge ' + ({
                          Administrador: 'text-bg-dark',
                          Vendedor: 'text-bg-info',
                          Cliente: 'text-bg-secondary',
                        }[u.tipo] ?? 'text-bg-light')}>{u.tipo}</span>
                      </td>
                      <td>{u.comuna}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <Link className="btn btn-outline-primary btn-sm" to={`/admin/usuarios/${u.id}`}>
                            Ver
                          </Link>
                          <Link className="btn btn-outline-primary btn-sm" to={`/admin/usuarios/${u.id}/editar`}>
                            Editar
                          </Link>
                          {esVendedor && !esPropio && u.activo && (
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => desactivar(u)}>
                              Desactivar
                            </button>
                          )}
                          {esVendedor && !esPropio && (
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => eliminar(u)}>
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
