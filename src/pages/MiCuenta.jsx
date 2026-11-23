import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import DatosCuenta from '../components/DatosCuenta.jsx'
import TablaOrdenes from '../components/TablaOrdenes.jsx'
import { listarMisBoletas } from '../services/boletasApi'
import usePageTitle from '../hooks/usePageTitle'

// Cuenta del usuario autenticado en la tienda: datos reales + vincular Google.
export default function MiCuenta() {
  usePageTitle('Mi cuenta')
  const [compras, setCompras] = useState([])

  useEffect(() => {
    let activo = true
    listarMisBoletas()
      .then((datos) => activo && setCompras([...datos].reverse()))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <PageHead eyebrow="TF / MI CUENTA" titulo="Mi cuenta">
        Revisa y actualiza tus datos personales, y vincula tu cuenta de Google.
      </PageHead>
      <section className="container py-4">
        <DatosCuenta />
      </section>

      <section className="container py-4">
        <h2 className="h4">Mis compras</h2>
        <TablaOrdenes ordenes={compras} vacio="Todavía no tienes compras registradas." />
      </section>
    </>
  )
}
