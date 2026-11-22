import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import CategoriaForm from '../../components/CategoriaForm.jsx'
import { crearCategoria } from '../../services/categoriasApi'
import usePageTitle from '../../hooks/usePageTitle'

export default function AdminNuevaCategoria() {
  usePageTitle('Nueva categoría', 'Panel Tecno Factory')
  const navigate = useNavigate()

  async function guardar(datos) {
    await crearCategoria(datos)
    setTimeout(() => navigate('/admin/categorias'), 1200)
  }

  return (
    <>
      <AdminHeader titulo="Nueva categoría" />
      <section>
        <CategoriaForm onGuardar={guardar} mensajeExito="Categoría guardada correctamente." />
      </section>
    </>
  )
}
