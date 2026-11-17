import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHead from '../components/PageHead.jsx'
import FormField from '../components/FormField.jsx'
import BotonGoogle from '../components/BotonGoogle.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { contrasenaApiValida, correoValido } from '../utils/validaciones'
import usePageTitle from '../hooks/usePageTitle'
import EstadoForm from '../components/EstadoForm.jsx'
import { ApiError } from '../services/api'

export default function IniciarSesion() {
  usePageTitle('Iniciar sesión')
  const { login, loginConGoogle } = useAuth()
  const navigate = useNavigate()

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviado, setEnviado] = useState(false) // ya se intentó enviar al menos una vez
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(false)

  const correoOk = correoValido(correo)
  const contrasenaOk = contrasenaApiValida(contrasena)
  const marca = (ok) => (enviado ? (ok ? 'valid' : 'invalid') : undefined)

  /** Después de autenticar, el staff entra al panel y el cliente a la tienda. */
  function entrar(sesion) {
    setEstado({ tipo: 'success', texto: 'Sesión iniciada correctamente. Redirigiendo...' })
    const esStaff = sesion.tipo === 'Administrador' || sesion.tipo === 'Vendedor'
    setTimeout(() => navigate(esStaff ? '/admin' : '/'), 900)
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviado(true)
    setEstado(null)

    if (!correoOk || !contrasenaOk) {
      setEstado({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' })
      return
    }

    setCargando(true)
    try {
      const sesion = await login(correo.trim(), contrasena)
      entrar(sesion)
    } catch (error) {
      if (error instanceof ApiError) {
        setEstado({
          tipo: 'error',
          texto:
            error.status === 401
              ? 'Correo o contraseña incorrectos.'
              : error.mensaje,
        })
      } else {
        setEstado({ tipo: 'error', texto: 'No se pudo iniciar sesión. Inténtalo de nuevo.' })
      }
    } finally {
      setCargando(false)
    }
  }

  async function entrarConGoogle(credential) {
    setEstado(null)
    setCargando(true)
    try {
      const resultado = await loginConGoogle(credential)
      if (resultado.requierePerfil) {
        sessionStorage.setItem('tf_google_pendiente', JSON.stringify(resultado.perfil))
        navigate('/registro/google')
        return
      }
      entrar(resultado.sesion)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setEstado({
          tipo: 'error',
          texto:
            'Ese correo ya tiene una cuenta con contraseña. Inicia sesión con tu contraseña y luego vincula Google desde "Mi cuenta".',
        })
      } else if (error instanceof ApiError && error.status === 401) {
        setEstado({ tipo: 'error', texto: 'La cuenta de Google no es válida o está desactivada.' })
      } else if (error instanceof ApiError) {
        setEstado({ tipo: 'error', texto: error.mensaje })
      } else {
        setEstado({ tipo: 'error', texto: 'No se pudo iniciar sesión con Google.' })
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <PageHead eyebrow="TF / MI CUENTA" titulo="Iniciar sesión">
        Ingresa con tu correo y contraseña para ver tus pedidos y tus datos guardados.
      </PageHead>

      <section className="container py-4">
        <form className="mx-auto" onSubmit={enviar} noValidate style={{ maxWidth: 420 }}>
          <FormField
            id="correo"
            label="Correo electrónico"
            hint="Puedes usar cualquier dominio de correo."
            error="Ingresa un correo válido."
            estado={marca(correoOk)}
          >
            <input type="text" id="correo" maxLength={100} autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </FormField>

          <FormField
            id="contrasena"
            label="Contraseña"
            hint="Entre 8 y 72 caracteres."
            error="La contraseña debe tener entre 8 y 72 caracteres."
            estado={marca(contrasenaOk)}
          >
            <input
              type="password"
              id="contrasena"
              maxLength={72}
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </FormField>

          <button type="submit" className="btn btn-warning" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>

          <hr className="my-4" />

          <p className="text-center text-body-secondary mb-2">o continúa con Google</p>
          <BotonGoogle onCredential={entrarConGoogle} />

          <p style={{ marginTop: 14 }}>
            ¿Aún no tienes cuenta? <Link to="/registro">Regístrate aquí</Link>.
          </p>

          <EstadoForm estado={estado} />
        </form>
      </section>
    </>
  )
}
