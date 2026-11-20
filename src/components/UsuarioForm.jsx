import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from './FormField.jsx'
import RegionComunaFields from './RegionComunaFields.jsx'
import { TIPOS_USUARIO } from '../data/constantes'
import { idComunaDe } from '../data/comunas'
import { ApiError } from '../services/api'
import {
  contrasenaApiValida,
  correoValido,
  fechaNacimientoValida,
  telefonoValido,
  validarRun,
} from '../utils/validaciones'
import EstadoForm from './EstadoForm.jsx'

function valoresIniciales(u) {
  return {
    run: u?.run ?? '',
    nombre: u?.nombre ?? '',
    apellidos: u?.apellidos ?? '',
    correo: u?.correo ?? '',
    contrasena: '',
    telefono: u?.telefono ?? '',
    fecha_nacimiento: u?.fecha_nacimiento ?? '',
    tipo: u?.tipo ?? '',
    region: u?.region ?? '',
    comuna: u?.comuna ?? '',
    direccion: u?.direccion ?? '',
  }
}

/**
 * Formulario de usuario para crear (sin `usuario`) o editar (con `usuario`).
 * Al editar, la contraseña es opcional: vacía = se conserva la actual.
 */
export default function UsuarioForm({
  usuario,
  onGuardar,
  mensajeExito,
  cancelarA = '/admin/usuarios',
  modoPerfil = false, // el usuario edita sus propios datos: no puede cambiar su tipo ni su RUN
  tipos = TIPOS_USUARIO,
}) {
  const editando = Boolean(usuario)
  const [v, setV] = useState(() => valoresIniciales(usuario))
  const [enviado, setEnviado] = useState(false)
  const [estado, setEstado] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const validos = {
    run: validarRun(v.run.trim()),
    nombre: v.nombre.trim().length > 0 && v.nombre.trim().length <= 50,
    apellidos: v.apellidos.trim().length > 0 && v.apellidos.trim().length <= 100,
    correo: correoValido(v.correo),
    // Al editar, dejarla vacía es válido (se mantiene la actual).
    contrasena: editando && v.contrasena.length === 0 ? true : contrasenaApiValida(v.contrasena),
    telefono: telefonoValido(v.telefono),
    fecha_nacimiento: fechaNacimientoValida(v.fecha_nacimiento),
    tipo: modoPerfil || v.tipo.length > 0,
    region: v.region.length > 0,
    comuna: Boolean(idComunaDe(v.comuna)),
    direccion: v.direccion.trim().length > 0 && v.direccion.trim().length <= 300,
  }
  const marca = (campo) => {
    if (!enviado) return undefined
    if (campo === 'contrasena' && editando && v.contrasena.length === 0) return undefined
    return validos[campo] ? 'valid' : 'invalid'
  }

  function cambiar(e) {
    const { name, value } = e.target
    // Al cambiar de región se limpia la comuna elegida.
    setV((prev) => ({ ...prev, [name]: value, ...(name === 'region' ? { comuna: '' } : {}) }))
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviado(true)
    setEstado(null)

    if (!Object.values(validos).every(Boolean)) {
      setEstado({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' })
      return
    }

    setGuardando(true)
    try {
      await onGuardar({
        run: v.run.trim(),
        nombre: v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        correo: v.correo.trim(),
        contrasena: v.contrasena,
        telefono: v.telefono.trim(),
        fecha_nacimiento: v.fecha_nacimiento,
        tipo: modoPerfil ? usuario.tipo : v.tipo,
        region: v.region,
        comuna: v.comuna,
        direccion: v.direccion.trim(),
        activo: usuario?.activo ?? true,
      })
      setEstado({ tipo: 'success', texto: mensajeExito })
    } catch (error) {
      // El backend ya valida duplicados y devuelve un mensaje concreto (409).
      const detalle = error instanceof ApiError && error.detalles
        ? Object.values(error.detalles)[0]
        : null
      setEstado({
        tipo: 'error',
        texto: detalle || (error instanceof ApiError ? error.mensaje : 'No se pudo guardar el usuario.'),
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="mx-auto" onSubmit={enviar} noValidate style={{ maxWidth: 720 }}>
      <FormField id="run" label="RUN" hint="Sin puntos ni guion. Ej: 190110222" error="RUN inválido, revisa el dígito verificador." estado={marca('run')}>
        <input type="text" id="run" name="run" maxLength={9} value={v.run} onChange={cambiar} readOnly={modoPerfil} />
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
        error={
          editando
            ? 'Correo inválido o ya está en uso por otro usuario.'
            : 'Correo inválido o ya está registrado.'
        }
        estado={marca('correo')}
      >
        <input type="email" id="correo" name="correo" maxLength={100} autoComplete="email" value={v.correo} onChange={cambiar} />
      </FormField>

      <FormField
        id="contrasena"
        label={editando ? 'Nueva contraseña' : 'Contraseña'}
        hint={
          editando
            ? 'Opcional. Déjala en blanco para mantener la contraseña actual. Si la cambias, entre 8 y 72 caracteres.'
            : 'Entre 8 y 72 caracteres. El usuario la usará para iniciar sesión.'
        }
        error="La contraseña debe tener entre 8 y 72 caracteres."
        estado={marca('contrasena')}
      >
        <input type="password" id="contrasena" name="contrasena" maxLength={72} autoComplete="new-password" value={v.contrasena} onChange={cambiar} />
      </FormField>

      <FormField
        id="telefono"
        label="Teléfono"
        hint="8 a 14 dígitos, con + opcional."
        error="Ingresa un teléfono válido."
        estado={marca('telefono')}
      >
        <input type="tel" id="telefono" name="telefono" maxLength={15} autoComplete="tel" value={v.telefono} onChange={cambiar} />
      </FormField>

      <FormField
        id="fecha_nacimiento"
        label="Fecha de nacimiento"
        error="Ingresa una fecha anterior a hoy."
        estado={marca('fecha_nacimiento')}
      >
        <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" value={v.fecha_nacimiento} onChange={cambiar} />
      </FormField>

      {!modoPerfil && (
        <FormField
          id="tipo"
          label="Tipo de usuario"
          hint={editando ? 'El rol no se puede cambiar desde aquí.' : undefined}
          error="Selecciona un tipo de usuario."
          estado={marca('tipo')}
        >
          <select id="tipo" name="tipo" value={v.tipo} onChange={cambiar} disabled={editando}>
            <option value="">Selecciona un tipo</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>
      )}

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

      <button type="submit" className="btn btn-warning me-2" disabled={guardando}>
        {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar usuario'}
      </button>
      {editando && (
        <Link to={cancelarA} className="btn btn-outline-primary">
          Cancelar
        </Link>
      )}
      <EstadoForm estado={estado} />
    </form>
  )
}
