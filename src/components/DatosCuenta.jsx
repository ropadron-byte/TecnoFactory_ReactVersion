import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from './FormField.jsx'
import RegionComunaFields from './RegionComunaFields.jsx'
import BotonGoogle from './BotonGoogle.jsx'
import EstadoForm from './EstadoForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../services/api'
import { idComunaDe } from '../data/comunas'
import { REGIONES } from '../data/regiones'
import {
  fechaNacimientoValida,
  separarRun,
  telefonoValido,
  validarRun,
} from '../utils/validaciones'

// El backend devuelve el nombre de la comuna; la región se deriva del catálogo
// local porque los nombres de región no siempre coinciden entre ambos.
function regionDeComuna(comuna) {
  return REGIONES.find((r) => r.comunas.includes(comuna))?.region ?? ''
}

function valoresIniciales(sesion) {
  return {
    run: sesion?.run ? `${sesion.run}${sesion.runDv ?? ''}` : '',
    nombre: sesion?.nombre ?? '',
    apellidos: sesion?.apellidos ?? '',
    telefono: sesion?.telefono ?? '',
    fecha_nacimiento: sesion?.fecha_nacimiento ?? '',
    region: regionDeComuna(sesion?.comuna),
    comuna: sesion?.comuna ?? '',
    direccion: sesion?.direccion ?? '',
  }
}

/** Vista de solo lectura para sesiones locales de demostración (sin JWT). */
function DatosSoloLectura({ sesion }) {
  const run = sesion.run ? `${sesion.run}${sesion.runDv ? `-${sesion.runDv}` : ''}` : '—'

  return (
    <dl className="row mb-4">
      <dt className="col-sm-4">Nombre</dt>
      <dd className="col-sm-8">
        {sesion.nombre} {sesion.apellidos}
      </dd>

      <dt className="col-sm-4">Correo</dt>
      <dd className="col-sm-8">{sesion.correo}</dd>

      <dt className="col-sm-4">RUN</dt>
      <dd className="col-sm-8">{run}</dd>

      <dt className="col-sm-4">Tipo de cuenta</dt>
      <dd className="col-sm-8">{sesion.tipo}</dd>

      <dt className="col-sm-4">Teléfono</dt>
      <dd className="col-sm-8">{sesion.telefono || '—'}</dd>

      <dt className="col-sm-4">Fecha de nacimiento</dt>
      <dd className="col-sm-8">{sesion.fecha_nacimiento || '—'}</dd>

      <dt className="col-sm-4">Comuna</dt>
      <dd className="col-sm-8">
        {sesion.comuna ? `${sesion.comuna}, ${sesion.region}` : '—'}
      </dd>

      <dt className="col-sm-4">Dirección</dt>
      <dd className="col-sm-8">{sesion.direccion || '—'}</dd>
    </dl>
  )
}

/** Datos de la cuenta autenticada: edición del perfil + vinculación con Google. */
export default function DatosCuenta() {
  const { sesion, actualizarPerfil, vincularGoogle } = useAuth()
  const [v, setV] = useState(() => valoresIniciales(sesion))
  const [enviado, setEnviado] = useState(false)
  const [estadoPerfil, setEstadoPerfil] = useState(null)
  const [estadoGoogle, setEstadoGoogle] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [vinculando, setVinculando] = useState(false)

  if (!sesion) return null

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

  function cambiar(e) {
    const { name, value } = e.target
    // Al cambiar de región se limpia la comuna elegida.
    setV((prev) => ({ ...prev, [name]: value, ...(name === 'region' ? { comuna: '' } : {}) }))
  }

  async function guardar(e) {
    e.preventDefault()
    setEnviado(true)
    setEstadoPerfil(null)

    if (!Object.values(validos).every(Boolean)) {
      setEstadoPerfil({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' })
      return
    }

    const { run, runDv } = separarRun(v.run)
    setGuardando(true)
    try {
      const nueva = await actualizarPerfil({
        run,
        runDv,
        nombre: v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        fechaNacimiento: v.fecha_nacimiento,
        direccion: v.direccion.trim(),
        telefono: v.telefono.trim(),
        idComuna: idComunaDe(v.comuna),
      })
      setV(valoresIniciales(nueva))
      setEnviado(false)
      setEstadoPerfil({ tipo: 'success', texto: 'Perfil actualizado correctamente.' })
    } catch (error) {
      if (error instanceof ApiError) {
        const detalle = error.detalles && Object.values(error.detalles)[0]
        setEstadoPerfil({ tipo: 'error', texto: detalle || error.mensaje })
      } else {
        setEstadoPerfil({ tipo: 'error', texto: 'No se pudo actualizar el perfil.' })
      }
    } finally {
      setGuardando(false)
    }
  }

  async function vincular(credential) {
    setEstadoGoogle(null)
    setVinculando(true)
    try {
      await vincularGoogle(credential)
      setEstadoGoogle({ tipo: 'success', texto: 'Cuenta de Google vinculada correctamente.' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setEstadoGoogle({
          tipo: 'error',
          texto:
            'No se pudo vincular: el correo de Google no coincide con el de tu cuenta o ya está vinculado.',
        })
      } else if (error instanceof ApiError) {
        setEstadoGoogle({ tipo: 'error', texto: error.mensaje })
      } else {
        setEstadoGoogle({ tipo: 'error', texto: 'No se pudo vincular la cuenta de Google.' })
      }
    } finally {
      setVinculando(false)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <p className="text-body-secondary">
        Tipo de cuenta: <strong>{sesion.tipo}</strong>
      </p>

      {sesion.token ? (
        <form className="mb-4" onSubmit={guardar} noValidate>
          <FormField id="correo" label="Correo" hint="El correo de la cuenta no se puede cambiar.">
            <input type="email" id="correo" value={sesion.correo} readOnly />
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

          <button type="submit" className="btn btn-warning" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <EstadoForm estado={estadoPerfil} />
        </form>
      ) : (
        <>
          <DatosSoloLectura sesion={sesion} />
          <p className="text-body-secondary small">
            Esta sesión es de demostración local; inicia sesión contra la API para editar tu perfil.
          </p>
        </>
      )}

      {sesion.token && (
        <section className="border-top pt-3">
          <h2 className="h5">Vincular con Google</h2>
          <p className="text-body-secondary">
            Si ya iniciaste sesión con contraseña, puedes vincular tu cuenta de Google para entrar
            más rápido la próxima vez. El correo de Google debe coincidir con <strong>{sesion.correo}</strong>.
          </p>
          {vinculando ? <p>Vinculando…</p> : <BotonGoogle onCredential={vincular} texto="signin_with" />}
          <EstadoForm estado={estadoGoogle} />
        </section>
      )}

      <p className="mt-4 mb-0">
        <Link to="/">Volver a la tienda</Link>
      </p>
    </div>
  )
}
