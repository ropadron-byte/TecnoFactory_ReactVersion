import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import BlogForm from '../../components/BlogForm.jsx'
import { cambiarPortada, crearBlog, subirImagenBlog } from '../../services/blogsApi'
import { listarImagenes } from '../../services/imagenesApi'
import usePageTitle from '../../hooks/usePageTitle'

export default function AdminNuevoBlog() {
  usePageTitle('Nuevo blog', 'Panel Tecno Factory')
  const navigate = useNavigate()
  const [imagenes, setImagenes] = useState([])
  const [archivo, setArchivo] = useState(null)

  useEffect(() => {
    let activo = true
    listarImagenes()
      .then((datos) => activo && setImagenes(datos))
      .catch(() => activo && setImagenes([]))
    return () => {
      activo = false
    }
  }, [])

  async function guardar(datos) {
    const creado = await crearBlog(datos)
    // Si se eligió un archivo, se sube al blog recién creado y se fija como portada.
    if (archivo) {
      const imagen = await subirImagenBlog(creado.id, archivo)
      await cambiarPortada(creado.id, imagen.id)
    }
    setTimeout(() => navigate('/admin/blogs'), 1200)
  }

  return (
    <>
      <AdminHeader titulo="Nuevo blog" />
      <section>
        <div className="card card-body mb-4">
          <label htmlFor="archivo-portada" className="form-label fw-semibold">
            Subir portada (opcional)
          </label>
          <div className="form-text mb-2">
            Si eliges un archivo, se sube al crear el blog y reemplaza la portada seleccionada abajo.
          </div>
          <input
            type="file"
            id="archivo-portada"
            accept="image/*"
            className="form-control"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </div>

        <BlogForm
          onGuardar={guardar}
          imagenesDisponibles={imagenes}
          mensajeExito="Blog creado correctamente en el servidor."
        />
      </section>
    </>
  )
}
