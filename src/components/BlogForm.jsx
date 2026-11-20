import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../services/api'
import FormField from './FormField.jsx'
import EstadoForm from './EstadoForm.jsx'

/** Formulario compartido de creación y edición de blogs. */
export default function BlogForm({
  blog,
  onGuardar,
  mensajeExito,
  cancelarA = '/admin/blogs',
  imagenesDisponibles = [],
}) {
  const editando = Boolean(blog)
  const [titulo, setTitulo] = useState(blog?.titulo ?? '')
  const [contenido, setContenido] = useState(blog?.contenido ?? '')
  const [visible, setVisible] = useState(blog?.visible ?? true)
  const [idImagenPrincipal, setIdImagenPrincipal] = useState(blog?.imagenPrincipal?.id ?? '')
  const [enviado, setEnviado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [estado, setEstado] = useState(null)

  const validos = {
    titulo: titulo.trim().length > 0 && titulo.trim().length <= 255,
    contenido: contenido.trim().length > 0 && contenido.trim().length <= 16000,
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviado(true)
    setEstado(null)

    if (!Object.values(validos).every(Boolean)) {
      setEstado({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' })
      return
    }

    setGuardando(true)
    try {
      await onGuardar({
        titulo: titulo.trim(),
        contenido,
        visible,
        idImagenPrincipal: idImagenPrincipal ? Number(idImagenPrincipal) : undefined,
      })
      setEstado({ tipo: 'success', texto: mensajeExito })
    } catch (error) {
      const detalle = error instanceof ApiError && error.detalles
        ? Object.values(error.detalles)[0]
        : null
      setEstado({
        tipo: 'error',
        texto: detalle || (error instanceof ApiError ? error.mensaje : 'No se pudo guardar el blog.'),
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <FormField
        id="titulo"
        label="Título"
        error="Escribe un título de hasta 255 caracteres."
        estado={enviado ? (validos.titulo ? 'valid' : 'invalid') : undefined}
      >
        <input
          type="text"
          id="titulo"
          name="titulo"
          maxLength={255}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </FormField>

      <FormField
        id="contenido"
        label="Contenido"
        hint="Texto plano: separa los párrafos con una línea en blanco. Máximo 16000 caracteres."
        error="Escribe un contenido de hasta 16000 caracteres."
        estado={enviado ? (validos.contenido ? 'valid' : 'invalid') : undefined}
      >
        <textarea
          id="contenido"
          name="contenido"
          rows={12}
          maxLength={16000}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
        />
      </FormField>

      {imagenesDisponibles.length > 0 && (
        <FormField id="idImagenPrincipal" label="Portada (opcional)" hint="Elige una imagen del catálogo del servidor.">
          <select
            id="idImagenPrincipal"
            name="idImagenPrincipal"
            value={idImagenPrincipal}
            onChange={(e) => setIdImagenPrincipal(e.target.value)}
          >
            <option value="">Sin portada</option>
            {imagenesDisponibles.map((imagen) => (
              <option key={imagen.id} value={imagen.id}>
                #{imagen.id} — {imagen.url}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="visible"
          name="visible"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="visible">
          Publicado (visible para los clientes)
        </label>
      </div>

      <button type="submit" className="btn btn-warning me-2" disabled={guardando}>
        {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear blog'}
      </button>
      <Link to={cancelarA} className="btn btn-outline-primary">
        Cancelar
      </Link>

      <EstadoForm estado={estado} />
    </form>
  )
}
