import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from './FormField.jsx'
import { validarCategoria } from '../utils/validaciones'
import { nombreCategoriaOcupado } from '../services/categoriasService'
import EstadoForm from './EstadoForm.jsx'

/** Formulario para crear (sin `categoria`) o editar (con `categoria`) una categoría. */
export default function CategoriaForm({ categoria, onGuardar, mensajeExito, cancelarA = '/admin/categorias' }) {
  const editando = Boolean(categoria)
  const [v, setV] = useState({
    nombre: categoria?.nombre ?? '',
    descripcion: categoria?.descripcion ?? '',
    imagen: categoria?.imagen ?? '',
  })
  const [enviado, setEnviado] = useState(false)
  const [estado, setEstado] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const ocupado = v.nombre.trim().length > 0 && nombreCategoriaOcupado(v.nombre, categoria?.id)
  const validos = validarCategoria(v, { nombreDisponible: !ocupado })
  const marca = (campo) => (enviado ? (validos[campo] ? 'valid' : 'invalid') : undefined)

  function cambiar(e) {
    const { name, value } = e.target
    setV((prev) => ({ ...prev, [name]: value }))
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviado(true)
    setEstado(null)

    if (!Object.values(validos).every(Boolean)) {
      setEstado({ tipo: 'error', texto: ocupado ? 'Ya existe una categoría con ese nombre.' : 'Revisa los campos marcados en rojo.' })
      return
    }

    setGuardando(true)
    try {
      await onGuardar({ nombre: v.nombre.trim(), descripcion: v.descripcion.trim(), imagen: v.imagen.trim() })
      setEstado({ tipo: 'success', texto: mensajeExito })
    } catch (error) {
      setEstado({ tipo: 'error', texto: error.message || 'No se pudo guardar la categoría.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="mx-auto" onSubmit={enviar} noValidate style={{ maxWidth: 720 }}>
      <FormField
        id="nombre"
        label="Nombre"
        hint={editando ? 'Si cambias el nombre, los productos de esta categoría se actualizan.' : 'Máximo 40 caracteres.'}
        error={ocupado ? 'Ya existe una categoría con ese nombre.' : 'El nombre es obligatorio (máx. 40 caracteres).'}
        estado={marca('nombre')}
      >
        <input type="text" id="nombre" name="nombre" maxLength={40} value={v.nombre} onChange={cambiar} />
      </FormField>

      <FormField id="descripcion" label="Descripción" hint="Obligatoria. Máximo 200 caracteres." error="La descripción es obligatoria (máx. 200 caracteres)." estado={marca('descripcion')}>
        <textarea id="descripcion" name="descripcion" maxLength={200} value={v.descripcion} onChange={cambiar} />
      </FormField>

      <FormField id="imagen" label="Imagen (URL)" hint="Opcional. Si no hay imagen se muestra un ícono." error="La URL es demasiado larga." estado={marca('imagen')}>
        <input type="text" id="imagen" name="imagen" placeholder="https://..." value={v.imagen} onChange={cambiar} />
      </FormField>

      <button type="submit" className="btn btn-warning me-2" disabled={guardando}>
        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar categoría'}
      </button>
      <Link to={cancelarA} className="btn btn-outline-primary">
        Cancelar
      </Link>
      <EstadoForm estado={estado} />
    </form>
  )
}
