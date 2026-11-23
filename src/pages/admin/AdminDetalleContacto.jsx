import { Link, useLoaderData } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import ListaDatos from '../../components/ListaDatos.jsx'
import { formatearFecha } from '../../utils/formato'
import usePageTitle from '../../hooks/usePageTitle'

// Detalle de un mensaje de contacto, cargado por el loader de la ruta.
export default function AdminDetalleContacto() {
  const mensaje = useLoaderData()
  usePageTitle('Mensaje de contacto', 'Panel Tecno Factory')

  const filas = [
    ['Fecha', formatearFecha(mensaje.fechaCreacion ?? mensaje.fecha)],
    ['Nombre', mensaje.nombre],
    ['Correo', mensaje.correo || '—'],
    ['Comentario', mensaje.comentario],
  ]

  return (
    <>
      <AdminHeader titulo={`Mensaje de ${mensaje.nombre}`} />

      <section className="card card-body">
        <ListaDatos filas={filas} />
        <p className="mt-4 mb-0">
          <Link className="btn btn-outline-primary btn-sm" to="/admin/contactos">
            ← Volver a mensajes
          </Link>
        </p>
      </section>
    </>
  )
}
