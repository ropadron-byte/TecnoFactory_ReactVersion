import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminOrdenes from '../pages/admin/AdminOrdenes.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

const base = { cliente: { nombre: 'Cliente', apellidos: 'Prueba', correo: 'c@x.cl' }, entrega: { tipo: 'retiro' }, items: [] }
// Así las deja guardadas sincronizarBoletas: de la más antigua a la más nueva
const ORDENES = [
  { ...base, id: 5, numero: '5', codigo: 'ORDER00005', fecha: '2026-11-20T12:00:00', estado: 'Pagada', total: 2346471 },
  { ...base, id: 6, numero: '6', codigo: 'ORDER00006', fecha: '2026-11-21T09:30:00', estado: 'Anulada', total: 284990 },
  { ...base, id: 1763800000000, numero: 'F20261122100000', codigo: 'ORDERF100000', fecha: '2026-11-22T10:00:00', estado: 'Fallida', total: 500 },
]

beforeEach(() => {
  localStorage.setItem('tf_ordenes', JSON.stringify(ORDENES))
})

describe('Vista AdminOrdenes', () => {
  it('lista las órdenes de la más nueva a la más antigua y filtra por estado, incluidas las anuladas', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminOrdenes, { ruta: '/admin/ordenes' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Órdenes / Boletas' })).toBeInTheDocument()
    const filas = () => screen.getAllByRole('row').slice(1)
    expect(filas()).toHaveLength(3)
    expect(filas()[0]).toHaveTextContent('F20261122100000')
    expect(filas()[2]).toHaveTextContent('#5')

    await user.click(screen.getByRole('button', { name: 'Anuladas' }))
    expect(filas()).toHaveLength(1)
    expect(filas()[0]).toHaveTextContent('#6')
    expect(filas()[0]).toHaveTextContent('Anulada')

    await user.click(screen.getByRole('button', { name: 'Pagadas' }))
    expect(filas()).toHaveLength(1)
    expect(filas()[0]).toHaveTextContent('ORDER00005')

    await user.click(screen.getByRole('button', { name: 'Con error de pago' }))
    expect(filas()[0]).toHaveTextContent('ORDERF100000')

    await user.click(screen.getByRole('link', { name: 'Ver boleta' }))
    expect(screen.getByText(/Destino: \/admin\/ordenes\//)).toBeInTheDocument()
  })
})
