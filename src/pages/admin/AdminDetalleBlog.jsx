import { Link, useLoaderData } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import { formatearFecha } from '../../utils/formato'
import { urlImagen } from '../../utils/imagenes'
import usePageTitle from '../../hooks/usePageTitle'

export default function AdminDetalleBlog() {
  const blog = useLoaderData()
  usePageTitle(blog.titulo, 'Panel Tecno Factory')

  return (
    <>
      <AdminHeader titulo={blog.titulo}>
        <Link className="btn btn-outline-primary btn-sm" to={`/admin/blogs/${blog.id}/editar`}>
          Editar
        </Link>
      </AdminHeader>

      <section className="card card-body">
        <dl className="row mb-0">
          <dt className="col-sm-3">Autor</dt>
          <dd className="col-sm-9">{blog.autorNombre || '—'} {blog.autorCorreo && <span className="text-body-secondary">({blog.autorCorreo})</span>}</dd>
          <dt className="col-sm-3">Fecha de creación</dt>
          <dd className="col-sm-9">{formatearFecha(blog.fechaCreacion)}</dd>
          <dt className="col-sm-3">Estado</dt>
          <dd className="col-sm-9">
            <span className={'badge ' + (blog.visible ? 'text-bg-success' : 'text-bg-secondary')}>
              {blog.visible ? 'Publicado' : 'Desactivado'}
            </span>
          </dd>
        </dl>

        {blog.imagenPrincipal?.url && (
          <img src={urlImagen(blog.imagenPrincipal.url)} alt={blog.titulo} className="img-fluid rounded my-3" style={{ maxHeight: 320, objectFit: 'cover' }} />
        )}

        <div style={{ whiteSpace: 'pre-line' }}>{blog.contenido}</div>

        {blog.imagenes?.length > 0 && (
          <>
            <h2 className="h6 mt-4">Galería</h2>
            <div className="d-flex flex-wrap gap-2">
              {blog.imagenes.map((imagen) => (
                <img key={imagen.id} src={urlImagen(imagen.url)} alt={`Imagen ${imagen.id}`} className="rounded" width="120" height="90" style={{ objectFit: 'cover' }} />
              ))}
            </div>
          </>
        )}

        <p className="mt-4 mb-0">
          <Link className="btn btn-outline-primary btn-sm" to="/admin/blogs">
            ← Volver a blogs
          </Link>
        </p>
      </section>
    </>
  )
}
