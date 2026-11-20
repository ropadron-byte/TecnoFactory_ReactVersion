import { Link, useLoaderData } from 'react-router-dom'
import PageHead from '../components/PageHead.jsx'
import { formatearFecha } from '../utils/formato'
import usePageTitle from '../hooks/usePageTitle'

function Contenido({ texto }) {
  const parrafos = (texto ?? '').split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  return parrafos.map((parrafo, i) => (
    <p key={i} style={{ whiteSpace: 'pre-line' }}>
      {parrafo}
    </p>
  ))
}

export default function DetalleBlog() {
  const blog = useLoaderData() // validado por el loader de la ruta
  usePageTitle(blog.titulo)

  return (
    <>
      <PageHead
        eyebrow={
          <>
            <Link to="/blogs">← Volver a blogs</Link> · {formatearFecha(blog.fechaCreacion)}
          </>
        }
        titulo={blog.titulo}
      />

      <article className="container py-4" style={{ maxWidth: 800 }}>
        {blog.imagenPrincipal?.url && (
          <img src={blog.imagenPrincipal.url} alt={blog.titulo} className="img-fluid rounded mb-4 w-100" />
        )}

        <Contenido texto={blog.contenido} />

        {blog.imagenes?.length > 0 && (
          <div className="row g-3 my-4">
            {blog.imagenes.map((imagen) => (
              <div className="col-6 col-md-4" key={imagen.id}>
                <img src={imagen.url} alt={`Imagen de ${blog.titulo}`} className="img-fluid rounded w-100" />
              </div>
            ))}
          </div>
        )}

        <hr className="my-4" />
        <p>
          <Link className="btn btn-outline-primary btn-sm" to="/blogs">
            ← Volver al listado de blogs
          </Link>
        </p>
      </article>
    </>
  )
}
