import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import UsuarioForm from '../../components/UsuarioForm.jsx'
import { crearUsuario } from '../../services/usuariosApi'
import { ROLES } from '../../data/constantes'
import usePageTitle from '../../hooks/usePageTitle'

// El backend no permite crear administradores desde el panel: solo vendedores (esta
// ruta) y clientes (registro público). Por eso el formulario no ofrece ese rol.
const TIPOS_CREABLES = [ROLES.vendedor, ROLES.cliente]

export default function AdminNuevoUsuario() {
  usePageTitle('Nuevo usuario', 'Panel Tecno Factory')
  const navigate = useNavigate()

  async function guardar(datos) {
    await crearUsuario(datos)
    setTimeout(() => navigate('/admin/usuarios'), 1200)
  }

  return (
    <>
      <AdminHeader titulo="Nuevo usuario" />
      <section>
        <UsuarioForm
          onGuardar={guardar}
          tipos={TIPOS_CREABLES}
          mensajeExito="Usuario creado correctamente en el servidor."
        />
      </section>
    </>
  )
}
