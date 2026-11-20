import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import EstadoForm from '../../components/EstadoForm.jsx'
import { ApiError } from '../../services/api'
import { activarBlog, desactivarBlog, eliminarBlog, listarBlogsGestion } from '../../services/blogsApi'
import { formatearFecha } from '../../utils/formato'
import { urlImagen } from '../../utils/imagenes'
import usePageTitle from '../../hooks/usePageTitle'

export default function AdminBlogs() {
  usePageTitle('Blogs', 'Panel Tecno Factory')
  const [blogs, setBlogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState(null)

  async function cargar() {
    try {
      setBlogs(await listarBlogsGestion())
    } catch (error) {
      setAviso({ tipo: 'error', texto: error instanceof ApiError ? error.mensaje : 'No se pudo cargar la lista de blogs.' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let activo = true
    listarBlogsGestion()
      .then((datos) => activo && setBlogs(datos))
      .catch((error) => activo && setAviso({
        tipo: 'error',
        texto: error instanceof ApiError ? error.mensaje : 'No se pudo cargar la lista de blogs.',
      }))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  async function cambiarVisibilidad(blog) {
    if (!blog.visible && !window.confirm(`¿Volver a publicar "${blog.titulo}"?`)) return
    if (blog.visible && !window.confirm(`¿Desactivar "${blog.titulo}"? Dejará de ser público.`)) return
    try {
      await (blog.visible ? desactivarBlog(blog.id) : activarBlog(blog.id))
      setAviso({ tipo: 'success', texto: blog.visible ? 'Blog desactivado.' : 'Blog publicado.' })
      await cargar()
    } catch (error) {
      setAviso({ tipo: 'error', texto: error instanceof ApiError ? error.mensaje : 'No se pudo cambiar la visibilidad.' })
    }
  }

  async function eliminar(blog) {
    if (!window.confirm(`¿Eliminar el blog "${blog.titulo}"? Esta acción no se puede deshacer.`)) return
    try {
      await eliminarBlog(blog.id)
      setAviso({ tipo: 'success', texto: 'Blog eliminado.' })
      await cargar()
    } catch (error) {
      setAviso({ tipo: 'error', texto: error instanceof ApiError ? error.mensaje : 'No se pudo eliminar el blog.' })
    }
  }

  return (
    <>
      <AdminHeader titulo="Blogs">
        <Link className="btn btn-warning btn-sm" to="/admin/blogs/nuevo">
          + Nuevo blog
        </Link>
      </AdminHeader>

      <section className="card card-body">
        <EstadoForm estado={aviso} className="mb-3" />

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={5}>Cargando blogs desde el servidor...</td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={5}>Todavía no hay blogs. Crea el primero desde el servidor.</td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {blog.imagenPrincipal?.url && (
                          <img src={urlImagen(blog.imagenPrincipal.url)} alt="" width="48" height="48" className="rounded object-fit-cover" />
                        )}
                        <span>{blog.titulo}</span>
                      </div>
                    </td>
                    <td>{blog.autorNombre || '—'}</td>
                    <td>{formatearFecha(blog.fechaCreacion)}</td>
                    <td>
                      <span className={'badge ' + (blog.visible ? 'text-bg-success' : 'text-bg-secondary')}>
                        {blog.visible ? 'Publicado' : 'Desactivado'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <Link className="btn btn-outline-primary btn-sm" to={`/admin/blogs/${blog.id}`}>
                          Ver
                        </Link>
                        <Link className="btn btn-outline-primary btn-sm" to={`/admin/blogs/${blog.id}/editar`}>
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => cambiarVisibilidad(blog)}
                        >
                          {blog.visible ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminar(blog)}
                        >
                          Eliminar
                        </button>
                      </div>
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
