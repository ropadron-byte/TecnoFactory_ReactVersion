import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHead from '../components/PageHead.jsx'
import FormField from '../components/FormField.jsx'
import RegionComunaFields from '../components/RegionComunaFields.jsx'
import BotonGoogle from '../components/BotonGoogle.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  contrasenaApiValida,
  correoValido,
  fechaNacimientoValida,
  separarRun,
  telefonoValido,
  validarRun,
} from '../utils/validaciones'
import { registrar } from '../services/authService'
import { idComunaDe } from '../data/comunas'
import usePageTitle from '../hooks/usePageTitle'
import EstadoForm from '../components/EstadoForm.jsx'
import { ApiError } from '../services/api'

const INICIAL = {
  run: '',
  nombre: '',
  apellidos: '',
  correo: '',
  contrasena: '',
  confirmar: '',
  telefono: '',
  fecha_nacimiento: '',
  region: '',
  comuna: '',
  direccion: '',
}

export default function RegistroUsuario() {
  usePageTitle('Crear cuenta')
  const navigate = useNavigate()
  const { loginConGoogle } = useAuth()
  const [v, setV] = useState(INICIAL)
  const [enviado, setEnviado] = useState(false)
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)

  function cambiar(e) {
    const { name, value } = e.target
    // Al cambiar de región se limpia la comuna elegida.
    setV((prev) => ({ ...prev, [name]: value, ...(name === 'region' ? { comuna: '' } : {}) }))
  }

  const validos = {
    run: validarRun(v.run.trim()),
    nombre: v.nombre.trim().length > 0 && v.nombre.trim().length <= 50,
    apellidos: v.apellidos.trim().length > 0 && v.apellidos.trim().length <= 100,
    correo: correoValido(v.correo),
    contrasena: contrasenaApiValida(v.contrasena),
    confirmar: v.confirmar === v.contrasena && contrasenaApiValida(v.contrasena),
    telefono: telefonoValido(v.telefono),
    fecha_nacimiento: fechaNacimientoValida(v.fecha_nacimiento),
    region: v.region.length > 0,
    comuna: v.comuna.length > 0 && Boolean(idComunaDe(v.comuna)),
    direccion: v.direccion.trim().length > 0 && v.direccion.trim().length <= 300,
  }
  const marca = (campo) => (enviado ? (validos[campo] ? 'valid' : 'invalid') : undefined)

  async function registrarmeConGoogle(credential) {
    setEstado(null)
    setCargandoGoogle(true)
    try {
      const resultado = await loginConGoogle(credential)
      if (resultado.requierePerfil) {
        // La cuenta aún no existe: se guarda el token temporal y se piden los datos.
        sessionStorage.setItem('tf_google_pendiente', JSON.stringify(resultado.perfil))
        navigate('/registro/google')
        return
      }
      const esStaff = resultado.sesion.tipo === 'Administrador' || resultado.sesion.tipo === 'Vendedor'
      setEstado({ tipo: 'success', texto: 'Sesión iniciada con Google. Redirigiendo...' })
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
      setCargandoGoogle(false)
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
      await registrar({
        run,
        runDv,
        nombre: v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        correo: v.correo.trim(),
        clave: v.contrasena,
        fechaNacimiento: v.fecha_nacimiento,
        telefono: v.telefono.trim(),
        direccion: v.direccion.trim(),
        idComuna: idComunaDe(v.comuna),
      })
      setEstado({ tipo: 'success', texto: 'Cuenta creada correctamente. Redirigiendo...' })
      setTimeout(() => navigate('/iniciar-sesion'), 1200)
    } catch (error) {
      if (error instanceof ApiError) {
        const detalle = error.detalles && Object.values(error.detalles)[0]
        setEstado({ tipo: 'error', texto: detalle || error.mensaje })
      } else {
        setEstado({ tipo: 'error', texto: 'No se pudo crear la cuenta. Inténtalo de nuevo.' })
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <PageHead eyebrow="TF / MI CUENTA" titulo="Crea tu cuenta">
        Regístrate para guardar tus datos y hacer seguimiento a tus pedidos.
      </PageHead>

      <section className="container py-4">
        <form className="mx-auto" onSubmit={enviar} noValidate style={{ maxWidth: 560 }}>
          <div className="text-center mb-2">
            {cargandoGoogle ? (
              <p>Conectando con Google…</p>
            ) : (
              <BotonGoogle onCredential={registrarmeConGoogle} texto="signup_with" />
            )}
          </div>
          <p className="text-center text-body-secondary">o regístrate con tu correo</p>
          <hr />

          <FormField id="run" label="RUN" hint="Sin puntos ni guion. Ej: 190110222" error="RUN inválido, revisa el dígito verificador." estado={marca('run')}>
            <input type="text" id="run" name="run" maxLength={9} value={v.run} onChange={cambiar} />
          </FormField>

          <FormField id="nombre" label="Nombre" error="El nombre es obligatorio (máx. 50 caracteres)." estado={marca('nombre')}>
            <input type="text" id="nombre" name="nombre" maxLength={50} autoComplete="given-name" value={v.nombre} onChange={cambiar} />
          </FormField>

          <FormField id="apellidos" label="Apellidos" error="Los apellidos son obligatorios (máx. 100 caracteres)." estado={marca('apellidos')}>
            <input type="text" id="apellidos" name="apellidos" maxLength={100} autoComplete="family-name" value={v.apellidos} onChange={cambiar} />
          </FormField>

          <FormField
            id="correo"
            label="Correo"
            hint="Puedes usar cualquier dominio de correo."
            error="Correo inválido."
            estado={marca('correo')}
          >
            <input type="email" id="correo" name="correo" maxLength={100} autoComplete="email" value={v.correo} onChange={cambiar} />
          </FormField>

          <FormField id="contrasena" label="Contraseña" hint="Entre 8 y 72 caracteres." error="La contraseña debe tener entre 8 y 72 caracteres." estado={marca('contrasena')}>
            <input type="password" id="contrasena" name="contrasena" maxLength={72} autoComplete="new-password" value={v.contrasena} onChange={cambiar} />
          </FormField>

          <FormField id="confirmar" label="Confirmar contraseña" error="Las contraseñas no coinciden." estado={marca('confirmar')}>
            <input type="password" id="confirmar" name="confirmar" maxLength={72} value={v.confirmar} onChange={cambiar} />
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

          <FormField id="direccion" label="Dirección" error="La dirección es obligatoria (máx. 300 caracteres)." estado={marca('direccion')}>
            <input type="text" id="direccion" name="direccion" maxLength={300} autoComplete="street-address" value={v.direccion} onChange={cambiar} />
          </FormField>

          <button type="submit" className="btn btn-warning" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
          <p style={{ marginTop: 14 }}>
            ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión aquí</Link>.
          </p>

          <EstadoForm estado={estado} />
        </form>
      </section>
    </>
  )
}
