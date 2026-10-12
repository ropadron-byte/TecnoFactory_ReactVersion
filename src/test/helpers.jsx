import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import { guardarUsuario, iniciarSesion } from '../services/usuariosService'

// Ayudas para probar UNA vista de forma aislada (sin Layout ni el resto de la app).

/** Rutas a las que la vista navega: muestran "Destino: <ruta>" para poder comprobarlo con getByText. */
function Destino() {
  const { pathname } = useLocation()
  return <p>Destino: {pathname}</p>
}

/**
 * Devuelve la vista lista para pasarla a `render(...)`, con sus proveedores
 * (sesión y carrito) y un router mínimo de una sola ruta.
 *  - ruta:   URL inicial (puede incluir ?query)
 *  - patron: patrón de la ruta (ej. '/productos/:codigo')
 *  - datos:  lo que devolvería el loader de la ruta (useLoaderData)
 *  - estado: location.state inicial
 */
export function vista(Vista, { ruta = '/', patron = ruta.split('?')[0], datos, estado } = {}) {
  const rutaVista = { path: patron, Component: Vista }
  if (datos !== undefined) {
    rutaVista.loader = () => datos
    rutaVista.HydrateFallback = () => null
  }
  const router = createMemoryRouter([rutaVista, { path: '*', Component: Destino }], {
    initialEntries: [estado ? { pathname: ruta, state: estado } : ruta],
  })
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  )
}

/** Inicia sesión con el administrador que viene de fábrica (id 1). */
export const entrarComoAdmin = () => iniciarSesion('admin@duoc.cl', 'admin123')

export const DATOS_USUARIO = {
  run: '190110222',
  nombre: 'Vera',
  apellidos: 'Rojas',
  correo: 'vera@duoc.cl',
  contrasena: 'vend1',
  tipo: 'Vendedor',
  region: 'Región Metropolitana',
  comuna: 'Santiago',
  direccion: 'Av. Siempre Viva 123',
}

/** Crea un usuario Vendedor e inicia su sesión. */
export function entrarComoVendedor() {
  guardarUsuario(DATOS_USUARIO)
  return iniciarSesion(DATOS_USUARIO.correo, DATOS_USUARIO.contrasena)
}

export const CLIENTE = { nombre: 'Pedro', apellidos: 'Hacker', correo: 'pedro@gmail.com' }
export const ENTREGA_RETIRO = { tipo: 'retiro', calle: '', departamento: '', region: '', comuna: '', indicaciones: '' }
