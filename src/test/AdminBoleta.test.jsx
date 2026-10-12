import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminBoleta from '../pages/admin/AdminBoleta.jsx'
import { CLIENTE, ENTREGA_RETIRO, entrarComoAdmin, vista } from './helpers.jsx'
import { procesarCompra } from '../services/ordenesService'

describe('Vista AdminBoleta', () => {
  it('muestra la boleta completa de una orden y permite volver al listado', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    const { orden } = procesarCompra({ carrito: [{ codigo: 'TF-NB-004', qty: 1 }], cliente: CLIENTE, entrega: ENTREGA_RETIRO })
    render(vista(AdminBoleta, { ruta: `/admin/ordenes/${orden.id}`, patron: '/admin/ordenes/:id', datos: orden }))

    expect(await screen.findByRole('heading', { level: 1, name: `Boleta #${orden.numero}` })).toBeInTheDocument()
    expect(screen.getByText(`Código orden: ${orden.codigo}`)).toBeInTheDocument()
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByText('Pedro Hacker')).toBeInTheDocument()
    expect(screen.getByText('Lenovo Yoga 920')).toBeInTheDocument()
    expect(screen.getByText('Total pagado: $1.044.990')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '← Volver a órdenes' }))
    expect(screen.getByText('Destino: /admin/ordenes')).toBeInTheDocument()
  })
})
