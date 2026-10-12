import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetalleProducto from '../pages/DetalleProducto.jsx'
import { vista } from './helpers.jsx'
import { imagenesProducto, obtenerProductoPorCodigo } from '../services/productosService'
import { getCart } from '../services/carritoService'

describe('Vista DetalleProducto', () => {
  it('muestra la ficha del producto, agrega la cantidad elegida al carrito y permite volver al catálogo', async () => {
    const user = userEvent.setup()
    const producto = obtenerProductoPorCodigo('TF-NB-004')
    const urls = imagenesProducto(producto)
    render(vista(DetalleProducto, { ruta: '/productos/TF-NB-004', patron: '/productos/:codigo', datos: producto }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lenovo Yoga 920' })).toBeInTheDocument()
    expect(screen.getByText('$1.044.990')).toBeInTheDocument()
    expect(screen.getByText('40 unidades disponibles')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Miniatura 2 de Lenovo Yoga 920' }))
    expect(screen.getByRole('img', { name: 'Lenovo Yoga 920' })).toHaveAttribute('src', urls[1])

    await user.click(screen.getByRole('button', { name: 'Sumar unidad' }))
    await user.click(screen.getByRole('button', { name: 'Sumar unidad' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(3)
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    expect(screen.getByText('Producto añadido al carrito.')).toBeInTheDocument()
    expect(getCart()).toEqual([{ codigo: 'TF-NB-004', qty: 3 }])

    await user.click(screen.getByRole('link', { name: '← Volver al catálogo' }))
    expect(screen.getByText('Destino: /productos')).toBeInTheDocument()
  })
})
