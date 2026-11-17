import PageHead from '../components/PageHead.jsx'
import DatosCuenta from '../components/DatosCuenta.jsx'
import usePageTitle from '../hooks/usePageTitle'

// Cuenta del usuario autenticado en la tienda: datos reales + vincular Google.
export default function MiCuenta() {
  usePageTitle('Mi cuenta')

  return (
    <>
      <PageHead eyebrow="TF / MI CUENTA" titulo="Mi cuenta">
        Revisa y actualiza tus datos personales, y vincula tu cuenta de Google.
      </PageHead>
      <section className="container py-4">
        <DatosCuenta />
      </section>
    </>
  )
}
