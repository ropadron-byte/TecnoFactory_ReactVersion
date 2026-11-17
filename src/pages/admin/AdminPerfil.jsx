import AdminHeader from '../../components/AdminHeader.jsx'
import UsuarioForm from '../../components/UsuarioForm.jsx'
import DatosCuenta from '../../components/DatosCuenta.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { actualizarUsuario, obtenerUsuarioPorId } from '../../services/usuariosService'
import usePageTitle from '../../hooks/usePageTitle'

// Perfil: con sesión real (API) muestra los datos del JWT; con la sesión
// local de demostración permite editar el usuario guardado en localStorage.
export default function AdminPerfil() {
  usePageTitle('Perfil', 'Panel Tecno Factory')
  const { sesion, recargarSesion } = useAuth()

  if (sesion?.origen === 'api') {
    return (
      <>
        <AdminHeader titulo="Mi perfil" />
        <section>
          <DatosCuenta />
        </section>
      </>
    )
  }

  const usuario = obtenerUsuarioPorId(sesion.id)

  if (!usuario) {
    return (
      <>
        <AdminHeader titulo="Perfil" />
        <section>
          <p>No encontramos tu cuenta. Cierra sesión y vuelve a ingresar.</p>
        </section>
      </>
    )
  }

  function guardar(datos) {
    actualizarUsuario(usuario.id, datos)
    recargarSesion()
  }

  return (
    <>
      <AdminHeader titulo="Mi perfil" />
      <section>
        <p className="text-body-secondary">
          Tipo de cuenta: <strong>{usuario.tipo}</strong>
        </p>
        <UsuarioForm
          key={usuario.id}
          usuario={usuario}
          modoPerfil
          onGuardar={guardar}
          mensajeExito="Perfil actualizado correctamente."
          cancelarA="/admin"
        />
      </section>
    </>
  )
}
