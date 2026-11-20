import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import BlogForm from '../../components/BlogForm.jsx'
import BlogGaleria from '../../components/BlogGaleria.jsx'
import { actualizarBlog } from '../../services/blogsApi'
import usePageTitle from '../../hooks/usePageTitle'

export default function AdminEditarBlog() {
  const blog = useLoaderData()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  usePageTitle('Editar blog', 'Panel Tecno Factory')

  async function guardar(datos) {
    await actualizarBlog(blog.id, datos)
    revalidator.revalidate()
    setTimeout(() => navigate('/admin/blogs'), 1200)
  }

  return (
    <>
      <AdminHeader titulo="Editar blog" />
      <section>
        <BlogForm
          blog={blog}
          onGuardar={guardar}
          mensajeExito="Blog actualizado correctamente."
        />
        <BlogGaleria blog={blog} onActualizado={() => revalidator.revalidate()} />
      </section>
    </>
  )
}
