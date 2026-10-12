import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompraError from '../pages/CompraError.jsx'
import { CLIENTE, ENTREGA_RETIRO, vista } from './helpers.jsx'
import { procesarCompra } from '../services/ordenesService'

describe('Vista CompraError', () => {
  it('informa que el pago falló, muestra la orden a pagar y permite reintentar', async () => {
    const user = userEvent.setup()
    const { orden } = procesarCompra({ carrito: [{ codigo: 'TF-NB-004', qty: 1 }], cliente: CLIENTE, entrega: ENTREGA_RETIRO, resultadoPago: 'rechazado' })
    render(vista(CompraError, { ruta: `/compra/error/${orden.id}`, patron: '/compra/error/:id', datos: orden }))

    expect(await screen.findByRole('heading', { level: 1, name: /No se pudo realizar el pago/ })).toBeInTheDocument()
    expect(screen.getByText('No se realizó ningún cobro y tus productos siguen en el carrito.')).toBeInTheDocument()
    expect(screen.getByText('Total a pagar: $1.044.990')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al carrito' })).toHaveAttribute('href', '/carrito')

    await user.click(screen.getByRole('button', { name: 'Volver a realizar el pago' }))
    expect(screen.getByText('Destino: /checkout')).toBeInTheDocument()
  })
})
