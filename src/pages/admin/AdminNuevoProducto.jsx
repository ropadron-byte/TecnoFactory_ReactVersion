import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import ProductoForm from '../../components/ProductoForm.jsx'
import { crearProducto } from '../../services/productosApi'
import usePageTitle from '../../hooks/usePageTitle'

export default function AdminNuevoProducto() {
  usePageTitle('Nuevo producto', 'Panel Tecno Factory')
  const navigate = useNavigate()

  async function guardar(producto) {
    await crearProducto(producto)
    setTimeout(() => navigate('/admin/productos'), 1200)
  }

  return (
    <>
      <AdminHeader titulo="Nuevo producto" />
      <section>
        <ProductoForm onGuardar={guardar} mensajeExito="Producto guardado correctamente." />
      </section>
    </>
  )
}
