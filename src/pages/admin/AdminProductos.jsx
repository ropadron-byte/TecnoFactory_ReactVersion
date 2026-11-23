import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import ProductImage from '../../components/ProductImage.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLES } from '../../data/constantes'
import PrecioProducto from '../../components/PrecioProducto.jsx'
import { activarProducto, desactivarProducto, listarProductosAdmin } from '../../services/productosApi'
import { imagenesProducto, obtenerProductos } from '../../services/productosService'
import usePageTitle from '../../hooks/usePageTitle'

function StockBadge({ producto }) {
  if (producto.stock <= 0) return <span className="badge text-bg-danger">Sin stock</span>
  if (producto.stock <= producto.stockCritico) return <span className="badge text-bg-danger">{producto.stock} (crítico)</span>
  return <span className="badge text-bg-success">{producto.stock}</span>
}

export default function AdminProductos() {
  usePageTitle('Productos', 'Panel Tecno Factory')
  const { sesion } = useAuth()
  const esAdmin = sesion.tipo === ROLES.admin
  const [productos, setProductos] = useState(obtenerProductos)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true
    listarProductosAdmin()
      .then((datos) => activo && datos && setProductos(datos))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  async function activar(p) {
    setError(null)
    try {
      await activarProducto(p.codigo)
      setProductos(obtenerProductos())
    } catch (e) {
      setError(e.message || 'No se pudo activar el producto.')
    }
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar el producto "${p.nombre}"? Dejará de mostrarse en la tienda.`)) return
    setError(null)
    try {
      await desactivarProducto(p.codigo)
      setProductos(obtenerProductos())
    } catch (e) {
      setError(e.message || 'No se pudo eliminar el producto.')
    }
  }

  return (
    <>
      <AdminHeader titulo="Productos" />

      <section>
        <p className="d-flex flex-wrap gap-2">
          {/* Solo el Administrador puede crear, editar o eliminar productos */}
          {esAdmin && (
            <Link className="btn btn-warning btn-sm" to="/admin/productos/nuevo">
              + Nuevo producto
            </Link>
          )}
          <Link className="btn btn-outline-primary btn-sm" to="/admin/productos/criticos">
            Productos críticos
          </Link>
          {esAdmin && (
            <Link className="btn btn-outline-primary btn-sm" to="/admin/productos/reportes">
              Reportes
            </Link>
          )}
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th></th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={7}>Aún no hay productos cargados.</td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.codigo}>
                    <td>
                      <div className="ratio ratio-1x1 bg-body-secondary rounded overflow-hidden" style={{ width: 44 }}>
                        <ProductImage url={imagenesProducto(p)[0]} alt={p.nombre} categoria={p.categoria} />
                      </div>
                    </td>
                    <td>{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td>{p.categoria}</td>
                    <td>
                      <PrecioProducto producto={p} className="mb-0" />
                    </td>
                    <td>
                      <StockBadge producto={p} />
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <Link className="btn btn-outline-primary btn-sm" to={`/admin/productos/${encodeURIComponent(p.codigo)}`}>
                          Ver
                        </Link>
                        {esAdmin && (
                          <>
                            <Link className="btn btn-outline-primary btn-sm" to={`/admin/productos/${encodeURIComponent(p.codigo)}/editar`}>
                              Editar
                            </Link>
                            {p.activo === false ? (
                              <button type="button" className="btn btn-outline-success btn-sm" onClick={() => activar(p)}>
                                Activar
                              </button>
                            ) : (
                              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => eliminar(p)}>
                                Eliminar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
