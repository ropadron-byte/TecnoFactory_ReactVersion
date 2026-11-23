import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as carrito from '../services/carritoService'
import { cambiarCantidad, obtenerCarrito, quitarItem } from '../services/carritoApi'
import { tokenActual } from '../services/api'
import { STORAGE_KEYS } from '../data/constantes'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => carrito.getCart())

  // Si el carrito cambia en otra pestaña, lo sincronizamos.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEYS.carrito || e.key === null) setCart(carrito.getCart())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // GET /carrito: se llama al abrir la página del carrito con sesión iniciada.
  const sincronizarCarrito = useCallback(async () => {
    if (!tokenActual()) return
    const items = await obtenerCarrito()
    if (items.length > 0) {
      carrito.saveCart(items)
      setCart(items)
    }
  }, [])

  // Cada acción modifica localStorage y luego refresca el estado de React.
  // Con JWT, el mismo cambio se refleja en el carrito del backend.
  function addToCart(codigo, qty) {
    const resultado = carrito.addToCart(codigo, qty)
    setCart(carrito.getCart())
    return resultado
  }
  function removeFromCart(codigo) {
    carrito.removeFromCart(codigo)
    setCart(carrito.getCart())
    if (tokenActual()) quitarItem(Number(codigo)).catch(() => {})
  }
  function updateCartQty(codigo, qty) {
    carrito.updateCartQty(codigo, qty)
    setCart(carrito.getCart())
    if (tokenActual()) cambiarCantidad(Number(codigo), qty).catch(() => {})
  }
  function clearCart() {
    carrito.clearCart()
    setCart([])
  }

  const value = {
    cart,
    totalItems: carrito.cartTotalItems(cart),
    totalPrice: carrito.cartTotalPrice(cart),
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    sincronizarCarrito,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
