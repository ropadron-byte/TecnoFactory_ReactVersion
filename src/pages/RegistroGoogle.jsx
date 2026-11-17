import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHead from '../components/PageHead.jsx'
import FormField from '../components/FormField.jsx'
import RegionComunaFields from '../components/RegionComunaFields.jsx'
import EstadoForm from '../components/EstadoForm.jsx'
import BotonGoogle from '../components/BotonGoogle.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { completarPerfilGoogle } from '../services/authService'
import { ApiError } from '../services/api'
import { idComunaDe } from '../data/comunas'
import {
  fechaNacimientoValida,
  separarRun,
  telefonoValido,
  validarRun,
} from '../utils/validaciones'
import usePageTitle from '../hooks/usePageTitle'

const CLAVE_PENDIENTE = 'tf_google_pendiente'

function leerPendiente() {
  try {
    const pendiente = JSON.parse(sessionStorage.getItem(CLAVE_PENDIENTE) || 'null')
    return pendiente?.registroToken ? pendiente : null
  } catch {
    return null
  }
}

function valoresIniciales(pendiente) {
  return {
    run: '',
    nombre: pendiente?.nombre ?? '',
    apellidos: pendiente?.apellidos ?? '',
    telefono: '',
    fecha_nacimiento: '',
    region: '',
    comuna: '',
    direccion: '',
  }
}

// Registro con Google en dos pasos: primero Google valida la identidad y,
// si la cuenta es nueva, se piden los datos personales que Google no entrega.
// La cuenta no se crea hasta enviar el formulario completo.
export default function RegistroGoogle() {
  const navigate = useNavigate()
  const { guardarSesion, loginConGoogle } = useAuth()
  const [pendiente, setPendiente] = useState(leerPendiente)
  const [v, setV] = useState(() => valoresIniciales(pendiente))
  const [enviado, setEnviado] = useState(false)
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(false)

  usePageTitle(pendiente ? 'Completa tu registro' : 'Registro con Google')

  function aplicarPendiente(perfil) {
    setPendiente(perfil)
    setV(valoresIniciales(perfil))
    setEnviado(false)
    setEstado(null)
  }

  function cambiar(e) {
    const { name, value } = e.target
    setV((prev) => ({ ...prev, [name]: value, ...(name === 'region' ? { comuna: '' } : {}) }))
  }

  const validos = {
    run: validarRun(v.run.trim()),
    nombre: v.nombre.trim().length > 0 && v.nombre.trim().length <= 255,
    apellidos: v.apellidos.trim().length > 0 && v.apellidos.trim().length <= 255,
    telefono: telefonoValido(v.telefono),
    fecha_nacimiento: fechaNacimientoValida(v.fecha_nacimiento),
    region: v.region.length > 0,
    comuna: v.comuna.length > 0 && Boolean(idComunaDe(v.comuna)),
    direccion: v.direccion.trim().length > 0 && v.direccion.trim().length <= 255,
  }
  const marca = (campo) => (enviado ? (validos[campo] ? 'valid' : 'invalid') : undefined)

  async function conGoogle(credential) {
    setEstado(null)
    setCargando(true)
    try {
      const resultado = await loginConGoogle(credential)
      if (resultado.requierePerfil) {
        sessionStorage.setItem(CLAVE_PENDIENTE, JSON.stringify(resultado.perfil))
        aplicarPendiente(resultado.perfil)
        return
      }
      const esStaff = resultado.sesion.tipo === 'Administrador' || resultado.sesion.tipo === 'Vendedor'
      setEstado({ tipo: 'success', texto: 'Sesión iniciada correctamente. Redirigiendo...' })
      setTimeout(() => navigate(esStaff ? '/admin' : '/'), 900)
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
        setEstado({ tipo: 'error', texto: 'No se pudo continuar con Google.' })
      }
    } finally {
      setCargando(false)
    }
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviado(true)
    setEstado(null)

    if (!Object.values(validos).every(Boolean)) {
      setEstado({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' })
      return
    }

    const { run, runDv } = separarRun(v.run)
    setCargando(true)
    try {
      const sesion = await completarPerfilGoogle({
        registroToken: pendiente.registroToken,
        run,
        runDv,
        nombre: v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        fechaNacimiento: v.fecha_nacimiento,
        direccion: v.direccion.trim(),
        telefono: v.telefono.trim(),
        idComuna: idComunaDe(v.comuna),
      })
      sessionStorage.removeItem(CLAVE_PENDIENTE)
      guardarSesion(sesion)
      setEstado({ tipo: 'success', texto: 'Perfil completado. Redirigiendo...' })
      setTimeout(() => navigate('/'), 900)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // El token temporal expiró: se vuelve a pedir la identidad a Google.
        sessionStorage.removeItem(CLAVE_PENDIENTE)
        setPendiente(null)
        setEstado({
          tipo: 'error',
          texto: 'Tu registro con Google expiró. Continúa con Google otra vez.',
        })
        return
      }
      if (error instanceof ApiError) {
        const detalle = error.detalles && Object.values(error.detalles)[0]
        setEstado({ tipo: 'error', texto: detalle || error.mensaje })
      } else {
        setEstado({ tipo: 'error', texto: 'No se pudo completar el perfil.' })
      }
    } finally {
      setCargando(false)
    }
  }

  function cancelar() {
    sessionStorage.removeItem(CLAVE_PENDIENTE)
    navigate('/registro')
  }

  if (!pendiente) {
    return (
      <>
        <PageHead eyebrow="TF / MI CUENTA" titulo="Regístrate con Google">
          Crea tu cuenta con Google y completa tus datos personales. No necesitas escribir un correo ni
          una contraseña.
        </PageHead>

        <section className="container py-4">
          <div className="mx-auto" style={{ maxWidth: 420 }}>
            {cargando ? (
              <p className="text-center">Conectando con Google…</p>
            ) : (
              <BotonGoogle onCredential={conGoogle} texto="signup_with" />
            )}

            <EstadoForm estado={estado} />

            <p className="mt-4">
              ¿Prefieres registrarte con correo y contraseña?{' '}
              <Link to="/registro">Crea tu cuenta aquí</Link>.
            </p>
            <p>
              ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link>.
            </p>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHead eyebrow="TF / MI CUENTA" titulo="Completa tu registro">
        Ya validamos tu cuenta de Google ({pendiente.correo}). Completa tus datos personales para crear la
        cuenta.
      </PageHead>

      <section className="container py-4">
        <form className="mx-auto" onSubmit={enviar} noValidate style={{ maxWidth: 560 }}>
          <FormField
            id="correo"
            label="Correo"
            hint="Es el correo de tu cuenta de Google y no se puede cambiar."
          >
            <input type="email" id="correo" value={pendiente.correo} readOnly />
          </FormField>

          <FormField id="run" label="RUN" hint="Sin puntos ni guion. Ej: 190110222" error="RUN inválido, revisa el dígito verificador." estado={marca('run')}>
            <input type="text" id="run" name="run" maxLength={9} value={v.run} onChange={cambiar} />
          </FormField>

          <FormField id="nombre" label="Nombre" error="El nombre es obligatorio." estado={marca('nombre')}>
            <input type="text" id="nombre" name="nombre" maxLength={255} autoComplete="given-name" value={v.nombre} onChange={cambiar} />
          </FormField>

          <FormField id="apellidos" label="Apellidos" error="Los apellidos son obligatorios." estado={marca('apellidos')}>
            <input type="text" id="apellidos" name="apellidos" maxLength={255} autoComplete="family-name" value={v.apellidos} onChange={cambiar} />
          </FormField>

          <FormField id="telefono" label="Teléfono" hint="Entre 8 y 14 dígitos, con + opcional." error="Ingresa un teléfono válido." estado={marca('telefono')}>
            <input type="tel" id="telefono" name="telefono" maxLength={15} autoComplete="tel" value={v.telefono} onChange={cambiar} />
          </FormField>

          <FormField id="fecha_nacimiento" label="Fecha de nacimiento" error="Ingresa una fecha anterior a hoy." estado={marca('fecha_nacimiento')}>
            <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" value={v.fecha_nacimiento} onChange={cambiar} />
          </FormField>

          <RegionComunaFields
            region={v.region}
            comuna={v.comuna}
            onChange={cambiar}
            estadoRegion={marca('region')}
            estadoComuna={marca('comuna')}
          />

          <FormField id="direccion" label="Dirección" error="La dirección es obligatoria (máx. 255 caracteres)." estado={marca('direccion')}>
            <input type="text" id="direccion" name="direccion" maxLength={255} autoComplete="street-address" value={v.direccion} onChange={cambiar} />
          </FormField>

          <button type="submit" className="btn btn-warning me-2" disabled={cargando}>
            {cargando ? 'Guardando…' : 'Crear cuenta'}
          </button>
          <button type="button" className="btn btn-outline-primary" onClick={cancelar} disabled={cargando}>
            Cancelar
          </button>

          <EstadoForm estado={estado} />
        </form>
      </section>
    </>
  )
}
