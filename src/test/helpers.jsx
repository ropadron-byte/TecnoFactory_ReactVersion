import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import { guardarSesion } from '../services/usuariosService'

/** Rutas a las que la vista navega: muestran "Destino: <ruta>" para poder comprobarlo con getByText. */
function Destino() {
  const { pathname } = useLocation()
  return <p>Destino: {pathname}</p>
}

/**
 * Devuelve la vista lista para pasarla a `render(...)`, con sesión API y router
 * mínimo de una sola ruta. No se usan datos locales de demostración.
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

/** Sesión con JWT que usan las pruebas de las vistas del panel. */
export const ADMIN_SESION = {
  token: 'jwt-de-prueba',
  origen: 'api',
  id: 1,
  run: '12345678',
  runDv: '5',
  nombre: 'Admin',
  apellidos: 'Tecno Factory',
  correo: 'ro.padron@duocuc.cl',
  tipo: 'Administrador',
  activo: true,
  region: 'Región Metropolitana',
  comuna: 'Santiago',
  direccion: 'Casa Matriz Tecno Factory',
  fecha_nacimiento: '',
  telefono: '',
}

export const entrarComoAdmin = () => guardarSesion({ ...ADMIN_SESION })
