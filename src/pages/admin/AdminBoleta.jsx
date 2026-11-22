import { useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader.jsx'
import OrdenResumen from '../../components/OrdenResumen.jsx'
import BoletaAcciones from '../../components/BoletaAcciones.jsx'
import EstadoForm from '../../components/EstadoForm.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLES } from '../../data/constantes'
import { anularBoleta } from '../../services/boletasApi'
import usePageTitle from '../../hooks/usePageTitle'

// "Mostrar boleta": detalle completo de una orden.
export default function AdminBoleta() {
  const cargada = useLoaderData()
  const { sesion } = useAuth()
  const [anulada, setAnulada] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [anulando, setAnulando] = useState(false)
  const orden = anulada?.id === cargada.id ? anulada : cargada
  // Solo el Administrador anula, y solo una boleta pagada (los pagos rechazados no tienen boleta)
  const puedeAnular = sesion?.tipo === ROLES.admin && orden.estado === 'Pagada'

  async function anular() {
    if (!window.confirm(`¿Anular la boleta #${orden.numero}? Se devolverá el stock de sus productos.`)) return
    setAviso(null)
    setAnulando(true)
    try {
      const actualizada = await anularBoleta(orden.id)
      if (actualizada) setAnulada(actualizada)
      setAviso({ tipo: 'success', texto: 'Boleta anulada. El stock de sus productos fue devuelto.' })
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message || 'No se pudo anular la boleta.' })
    } finally {
      setAnulando(false)
    }
  }

  usePageTitle(`Boleta #${orden.numero}`, 'Panel Tecno Factory')

  return (
    <>
      <AdminHeader titulo={`Boleta #${orden.numero}`} />

      <section>
        <div className="card card-body mb-3">
          <p className="d-flex flex-wrap gap-3 align-items-center text-body-secondary">
            <span>Código orden: {orden.codigo}</span>
            <span>{new Date(orden.fecha).toLocaleString('es-CL')}</span>
            <span className={'badge ' + (orden.estado === 'Pagada' ? 'text-bg-success' : 'text-bg-danger')}>{orden.estado}</span>
          </p>
          <OrdenResumen orden={orden} />
          <BoletaAcciones orden={orden} />
          {puedeAnular && (
            <p className="text-center mt-2 mb-0 no-print">
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={anular} disabled={anulando}>
                {anulando ? 'Anulando…' : 'Anular boleta'}
              </button>
            </p>
          )}
          <EstadoForm estado={aviso} className="mt-3 no-print" />
        </div>
        <p className="no-print">
          <Link className="btn btn-outline-primary btn-sm" to="/admin/ordenes">
            ← Volver a órdenes
          </Link>
        </p>
      </section>
    </>
  )
}
