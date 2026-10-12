import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminOrdenes from '../pages/admin/AdminOrdenes.jsx'
import { CLIENTE, ENTREGA_RETIRO, entrarComoAdmin, vista } from './helpers.jsx'
import { procesarCompra } from '../services/ordenesService'

const comprar = (resultadoPago) =>
  procesarCompra({ carrito: [{ codigo: 'TF-NB-004', qty: 1 }], cliente: CLIENTE, entrega: ENTREGA_RETIRO, resultadoPago })

describe('Vista AdminOrdenes', () => {
  it('lista las órdenes de la más nueva a la más antigua, las filtra por estado y abre una boleta', async () => {
    const user = userEvent.setup()
    comprar('exitoso')
    comprar('rechazado')
    entrarComoAdmin()
    render(vista(AdminOrdenes, { ruta: '/admin/ordenes' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Órdenes / Boletas' })).toBeInTheDocument()
    const enlaces = screen.getAllByRole('link', { name: 'Ver boleta' })
    expect(enlaces[0]).toHaveAttribute('href', '/admin/ordenes/2')
    expect(enlaces[1]).toHaveAttribute('href', '/admin/ordenes/1')

    await user.click(screen.getByRole('button', { name: 'Pagadas' }))
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.queryByText('Fallida')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Con error de pago' }))
    expect(screen.getByText('Fallida')).toBeInTheDocument()
    expect(screen.queryByText('Pagada')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Todas' }))
    await user.click(screen.getAllByRole('link', { name: 'Ver boleta' })[0])
    expect(screen.getByText('Destino: /admin/ordenes/2')).toBeInTheDocument()
  })
})
