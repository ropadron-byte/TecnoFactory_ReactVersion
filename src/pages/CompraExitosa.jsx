import { useEffect, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import PageHead from '../components/PageHead.jsx'
import OrdenResumen from '../components/OrdenResumen.jsx'
import BoletaAcciones from '../components/BoletaAcciones.jsx'
import { buscarBoleta } from '../services/boletasApi'
import { ordenDesdeBoleta } from '../services/compraApi'
import usePageTitle from '../hooks/usePageTitle'

// Pantalla "compra exitosa" con el resumen de la orden (el loader valida la orden).
export default function CompraExitosa() {
  const cargada = useLoaderData()
  const [orden, setOrden] = useState(cargada)
  usePageTitle('Compra exitosa')

  useEffect(() => {
    let activo = true
    buscarBoleta(cargada.id)
      .then((boleta) => {
        if (activo && boleta?.detalles) {
          setOrden(
            ordenDesdeBoleta(boleta, {
              cliente: cargada.cliente,
              entrega: cargada.entrega,
              usuarioId: cargada.usuarioId,
            }),
          )
        }
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [cargada])

  return (
    <>
      <PageHead eyebrow={`Código orden: ${orden.codigo}`} titulo={`✅ Se ha realizado la compra. nro #${orden.numero}`}>
        Puedes imprimir tu boleta o enviarla a {orden.cliente.correo}.
      </PageHead>

      <section className="container py-4">
        <div className="card card-body mb-3">
          <OrdenResumen orden={orden} />
          <BoletaAcciones orden={orden} />
        </div>
        <p className="no-print">
          <Link className="btn btn-outline-primary" to="/productos">
            Seguir comprando
          </Link>
        </p>
      </section>
    </>
  )
}
