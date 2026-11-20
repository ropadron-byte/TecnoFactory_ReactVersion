import { useEffect, useState } from 'react'
import { Badge, Button } from 'react-bootstrap'
import AdminHeader from '../../components/AdminHeader.jsx'
import EstadoForm from '../../components/EstadoForm.jsx'
import { ApiError } from '../../services/api'
import { urlImagen } from '../../utils/imagenes'
import {
  desacoplarImagenDe,
  desacoplarImagenDeTodos,
  eliminarImagen,
  listarImagenes,
  reemplazarImagen,
  subirImagen,
} from '../../services/imagenesApi'
import usePageTitle from '../../hooks/usePageTitle'

const FILTROS = [
  { valor: 'todos', texto: 'Todas' },
  { valor: 'libre', texto: 'Sin dueño' },
  { valor: 'BLOG', texto: 'Blogs' },
  { valor: 'PRODUCTO', texto: 'Productos' },
  { valor: 'CATEGORIA', texto: 'Categorías' },
]

function textoError(error, fallback) {
  return error instanceof ApiError ? error.mensaje : fallback
}

export default function AdminImagenes() {
  usePageTitle('Imágenes', 'Panel Tecno Factory')
  const [imagenes, setImagenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [destino, setDestino] = useState('general')
  const [reemplazos, setReemplazos] = useState({})
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let activo = true
    listarImagenes()
      .then((datos) => activo && setImagenes(datos))
      .catch((error) => activo && setAviso({
        tipo: 'error',
        texto: textoError(error, 'No se pudo cargar el catálogo de imágenes.'),
      }))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  async function recargar() {
    setImagenes(await listarImagenes())
  }

  async function ejecutar(accion, mensaje) {
    setOcupado(true)
    setAviso(null)
    try {
      await accion()
      setAviso({ tipo: 'success', texto: mensaje })
      await recargar()
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: textoError(error, 'No se pudo completar la acción.'),
      })
    } finally {
      setOcupado(false)
    }
  }

  async function subir(evento) {
    evento.preventDefault()
    if (!archivo) {
      setAviso({ tipo: 'error', texto: 'Selecciona un archivo para subir.' })
      return
    }
    await ejecutar(() => subirImagen(archivo, destino), 'Imagen subida al catálogo.')
    setArchivo(null)
  }

  async function copiar(imagen) {
    try {
      await navigator.clipboard?.writeText(urlImagen(imagen.url))
      setAviso({ tipo: 'success', texto: 'URL copiada al portapapeles.' })
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo copiar la URL.' })
    }
  }

  const normalizado = busqueda.trim().toLowerCase()
  const visibles = imagenes.filter((imagen) => {
    const coincideTexto = !normalizado || `${imagen.id} ${imagen.url}`.toLowerCase().includes(normalizado)
    const coincideFiltro = filtro === 'todos'
      || (filtro === 'libre' ? imagen.duenos.length === 0 : imagen.duenos.some((d) => d.tipo === filtro))
    return coincideTexto && coincideFiltro
  })

  return (
    <>
      <AdminHeader titulo="Imágenes" />

      <EstadoForm estado={aviso} className="mb-3" />

      <section className="card card-body mb-4">
        <h2 className="h5">Subir imagen</h2>
        <p className="text-body-secondary small">
          La imagen queda registrada sin dueño. Después puedes asignarla desde el blog, producto o categoría que corresponda.
        </p>
        <form onSubmit={subir} className="row g-3 align-items-end">
          <div className="col-md-6">
            <label htmlFor="archivo-imagen" className="form-label fw-semibold">Archivo de imagen</label>
            <input
              type="file"
              id="archivo-imagen"
              accept="image/jpeg,image/png,image/webp"
              className="form-control"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="destino-imagen" className="form-label fw-semibold">Destino</label>
            <select
              id="destino-imagen"
              className="form-select"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            >
              <option value="general">General</option>
              <option value="productos">Productos</option>
            </select>
          </div>
          <div className="col-md-3">
            <Button type="submit" variant="warning" disabled={ocupado || !archivo}>
              Subir imagen
            </Button>
          </div>
        </form>
      </section>

      <section className="card card-body">
        <div className="row g-3 align-items-end mb-3">
          <div className="col-md-3">
            <label htmlFor="filtro-imagenes" className="form-label fw-semibold">Filtrar por uso</label>
            <select
              id="filtro-imagenes"
              className="form-select"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              {FILTROS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label htmlFor="buscar-imagenes" className="form-label fw-semibold">Buscar por id o URL</label>
            <input
              type="search"
              id="buscar-imagenes"
              className="form-control"
              placeholder="Ej: 12 o /uploads/blog/"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="col-md-4 text-md-end text-body-secondary small">
            Mostrando {visibles.length} de {imagenes.length} imágenes
          </div>
        </div>

        {cargando ? (
          <p className="text-body-secondary mb-0">Cargando imágenes desde el servidor...</p>
        ) : visibles.length === 0 ? (
          <p className="text-body-secondary mb-0">
            {imagenes.length === 0 ? 'Todavía no hay imágenes en el catálogo. Sube la primera arriba.' : 'No hay imágenes que coincidan con el filtro.'}
          </p>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
            {visibles.map((imagen) => (
              <div className="col" key={imagen.id}>
                <div className="card h-100">
                  <img
                    src={urlImagen(imagen.url)}
                    alt={`Imagen ${imagen.id}`}
                    className="card-img-top bg-light"
                    style={{ height: 160, objectFit: 'contain' }}
                  />
                  <div className="card-body d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Imagen #{imagen.id}</strong>
                      <Badge bg={imagen.duenos.length === 0 ? 'secondary' : 'success'}>
                        {imagen.duenos.length === 0 ? 'Sin dueño' : `${imagen.duenos.length} uso(s)`}
                      </Badge>
                    </div>
                    <small className="text-body-secondary text-break">{imagen.url}</small>

                    <div className="d-flex flex-wrap gap-1">
                      {imagen.duenos.length === 0 ? (
                        <span className="text-body-secondary small">Sin relaciones.</span>
                      ) : imagen.duenos.map((dueno) => (
                        <Badge key={`${dueno.tipo}-${dueno.id}`} bg="secondary" className="d-inline-flex align-items-center gap-1">
                          {dueno.tipo} #{dueno.id}
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-white"
                            aria-label={`Quitar ${dueno.tipo} ${dueno.id} de la imagen ${imagen.id}`}
                            disabled={ocupado}
                            onClick={() => ejecutar(
                              () => desacoplarImagenDe(imagen.id, dueno.tipo, dueno.id),
                              'Imagen desacoplada del elemento.',
                            )}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        href={urlImagen(imagen.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir
                      </Button>
                      <Button size="sm" variant="outline-primary" onClick={() => copiar(imagen)}>
                        Copiar URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        disabled={ocupado || imagen.duenos.length === 0}
                        aria-label={`Desacoplar imagen ${imagen.id} de todos`}
                        onClick={() => {
                          if (!window.confirm(`¿Dejar la imagen #${imagen.id} sin dueños?`)) return
                          ejecutar(
                            () => desacoplarImagenDeTodos(imagen.id),
                            'Imagen desacoplada de todos sus dueños.',
                          )
                        }}
                      >
                        Desacoplar todos
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={ocupado}
                        aria-label={`Eliminar imagen ${imagen.id}`}
                        onClick={() => {
                          if (!window.confirm(`¿Eliminar la imagen #${imagen.id}? Esta acción no se puede deshacer.`)) return
                          ejecutar(() => eliminarImagen(imagen.id), 'Imagen eliminada del catálogo.')
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>

                    <div className="border-top pt-2">
                      <label htmlFor={`reemplazo-${imagen.id}`} className="form-label small fw-semibold mb-1">
                        Reemplazar archivo
                      </label>
                      <div className="d-flex gap-2 align-items-center">
                        <input
                          type="file"
                          id={`reemplazo-${imagen.id}`}
                          aria-label={`Archivo de reemplazo de la imagen ${imagen.id}`}
                          accept="image/jpeg,image/png,image/webp"
                          className="form-control form-control-sm"
                          onChange={(e) => setReemplazos((prev) => ({
                            ...prev,
                            [imagen.id]: e.target.files?.[0] ?? null,
                          }))}
                        />
                        <Button
                          size="sm"
                          variant="outline-primary"
                          disabled={ocupado || !reemplazos[imagen.id]}
                          aria-label={`Reemplazar imagen ${imagen.id}`}
                          onClick={() => ejecutar(
                            () => reemplazarImagen(imagen.id, reemplazos[imagen.id]),
                            `Archivo de la imagen #${imagen.id} reemplazado.`,
                          )}
                        >
                          Reemplazar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
