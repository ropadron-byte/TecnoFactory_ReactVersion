import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Carrito from '../pages/Carrito.jsx'
import { vista } from './helpers.jsx'
import { addToCart, getCart } from '../services/carritoService'

describe('Vista Carrito', () => {
  it('muestra los productos con su total, permite sumar, sugerir, quitar y limpiar, y lleva al catálogo', async () => {
    const user = userEvent.setup()
    addToCart('TF-NB-004', 2)
    render(vista(Carrito, { ruta: '/carrito' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mi carrito de compras' })).toBeInTheDocument()
    expect(screen.getByText('Lenovo Yoga 920')).toBeInTheDocument()
    expect(screen.getAllByText('$2.089.980')).toHaveLength(2) // subtotal y total
    expect(screen.getByRole('link', { name: 'Comprar ahora' })).toHaveAttribute('href', '/checkout')

    await user.click(screen.getByRole('button', { name: 'Sumar unidad' }))
    expect(screen.getAllByText('$3.134.970')).toHaveLength(2)
    expect(getCart()).toEqual([{ codigo: 'TF-NB-004', qty: 3 }])

    expect(screen.getByRole('complementary', { name: 'Productos disponibles' })).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /^Añadir .* al carrito$/ })[0])
    expect(screen.getAllByRole('button', { name: 'Quitar' })).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: 'Quitar' })[0])
    expect(screen.getAllByRole('button', { name: 'Quitar' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Limpiar carrito' }))
    expect(screen.getByText(/Tu carrito está vacío/)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ver catálogo' }))
    expect(screen.getByText('Destino: /productos')).toBeInTheDocument()
  })
})
