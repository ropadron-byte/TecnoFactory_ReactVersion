import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import { listarContactos } from '../../services/contactosApi'
import { formatearFecha } from '../../utils/formato'
import usePageTitle from '../../hooks/usePageTitle'

// Mensajes recibidos desde el formulario público (solo los lee el administrador).
export default function AdminContactos() {
  usePageTitle('Mensajes de contacto', 'Panel Tecno Factory')
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    listarContactos()
      .then((datos) => activo && setMensajes(datos))
      .catch(() => activo && setMensajes([]))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <AdminHeader titulo="Mensajes de contacto" />

      <section>
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Comentario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={5}>Cargando mensajes…</td>
                </tr>
              ) : mensajes.length === 0 ? (
                <tr>
                  <td colSpan={5}>Todavía no hay mensajes.</td>
                </tr>
              ) : (
                mensajes.map((mensaje) => (
                  <tr key={mensaje.id}>
                    <td>{formatearFecha(mensaje.fechaCreacion ?? mensaje.fecha)}</td>
                    <td>{mensaje.nombre}</td>
                    <td>{mensaje.correo || '—'}</td>
                    <td>{mensaje.comentario}</td>
                    <td>
                      <Link className="btn btn-outline-primary btn-sm" to={`/admin/contactos/${mensaje.id}`}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
