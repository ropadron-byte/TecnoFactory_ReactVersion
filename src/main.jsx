import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/app.css'
import { createRouter } from './router.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { sincronizarCatalogo } from './services/catalogoApi'

// El catálogo se trae del backend ANTES de crear el router: los loaders de las
// rutas se ejecutan al crearlo y leen la copia local. Si el backend no responde,
// la tienda arranca con lo que haya guardado.
sincronizarCatalogo().finally(() => {
  const router = createRouter()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </StrictMode>,
  )
})
