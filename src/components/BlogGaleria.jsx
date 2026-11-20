import { useState } from 'react'
import { Alert, Badge, Button } from 'react-bootstrap'
import { ApiError } from '../services/api'
import {
  agregarImagenExistente,
  cambiarPortada,
  quitarImagen,
  subirImagenBlog,
} from '../services/blogsApi'

/** Galería y portada de un blog ya guardado. Tras cada cambio se recarga el detalle. */
export default function BlogGaleria({ blog, onActualizado }) {
  const [archivo, setArchivo] = useState(null)
  const [idExistente, setIdExistente] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [estado, setEstado] = useState(null)

  async function ejecutar(accion, mensaje) {
    setOcupado(true)
    setEstado(null)
    try {
      await accion()
      setEstado({ tipo: 'success', texto: mensaje })
      await onActualizado()
    } catch (error) {
      setEstado({
        tipo: 'error',
        texto: error instanceof ApiError ? error.mensaje : 'No se pudo actualizar la galería.',
      })
    } finally {
      setOcupado(false)
    }
  }

  const imagenes = blog.imagenes ?? []

  return (
    <section className="card card-body mt-4">
      <h2 className="h5">Galería y portada</h2>

      {imagenes.length === 0 ? (
        <p className="text-body-secondary mb-3">Este blog todavía no tiene imágenes.</p>
      ) : (
        <div className="d-flex flex-wrap gap-3 mb-3">
          {imagenes.map((imagen) => {
            const esPortada = blog.imagenPrincipal?.id === imagen.id
            return (
              <div key={imagen.id} className="border rounded p-2" style={{ width: 180 }}>
                <img src={imagen.url} alt={`Imagen ${imagen.id}`} className="img-fluid rounded mb-2" style={{ height: 110, objectFit: 'cover', width: '100%' }} />
                <div className="d-flex justify-content-between align-items-center gap-1 mb-2">
                  <small className="text-body-secondary">#{imagen.id}</small>
                  {esPortada && <Badge bg="warning" text="dark">Portada</Badge>}
                </div>
                <div className="d-flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={ocupado || esPortada}
                    onClick={() => ejecutar(() => cambiarPortada(blog.id, imagen.id), 'Portada actualizada.')}
                  >
                    Usar como portada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={ocupado}
                    onClick={() => ejecutar(() => quitarImagen(blog.id, imagen.id), 'Imagen quitada de la galería.')}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="row g-3 align-items-end">
        <div className="col-md-6">
          <label htmlFor="archivo-galeria" className="form-label fw-semibold">
            Subir imagen nueva
          </label>
          <div className="input-group">
            <input
              type="file"
              id="archivo-galeria"
              accept="image/*"
              className="form-control"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline-primary"
              disabled={ocupado || !archivo}
              onClick={() => ejecutar(() => subirImagenBlog(blog.id, archivo), 'Imagen subida y agregada a la galería.')}
            >
              Subir y agregar
            </Button>
          </div>
        </div>
        <div className="col-md-6">
          <label htmlFor="id-imagen-existente" className="form-label fw-semibold">
            Agregar imagen existente
          </label>
          <div className="input-group">
            <input
              type="number"
              id="id-imagen-existente"
              min="1"
              className="form-control"
              placeholder="ID de la imagen"
              value={idExistente}
              onChange={(e) => setIdExistente(e.target.value)}
            />
            <Button
              variant="outline-primary"
              disabled={ocupado || !idExistente}
              onClick={() => ejecutar(
                () => agregarImagenExistente(blog.id, Number(idExistente)),
                'Imagen agregada a la galería.',
              )}
            >
              Agregar
            </Button>
          </div>
        </div>
      </div>

      {estado && (
        <Alert variant={estado.tipo === 'success' ? 'success' : 'danger'} className="mt-3 mb-0" role="alert">
          {estado.texto}
        </Alert>
      )}
    </section>
  )
}
