import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminReportes from '../pages/admin/AdminReportes.jsx'
import { CLIENTE, ENTREGA_RETIRO, entrarComoAdmin, vista } from './helpers.jsx'
import { procesarCompra } from '../services/ordenesService'

vi.mock('../services/usuariosApi.js', () => ({
  listarUsuarios: vi.fn(),
}))
import { listarUsuarios } from '../services/usuariosApi'

const createOriginal = URL.createObjectURL
const revokeOriginal = URL.revokeObjectURL
afterEach(() => {
  URL.createObjectURL = createOriginal
  URL.revokeObjectURL = revokeOriginal
})

beforeEach(() => {
  vi.clearAllMocks()
  listarUsuarios.mockResolvedValue([
    { id: 1, tipo: 'Administrador' },
    { id: 2, tipo: 'Vendedor' },
  ])
})

describe('Vista AdminReportes', () => {
  it('resume las ventas, los más vendidos y los usuarios por tipo desde la API', async () => {
    const user = userEvent.setup()
    let archivo = null
    URL.createObjectURL = (blob) => {
      archivo = blob
      return 'blob:reporte'
    }
    URL.revokeObjectURL = () => {}
    procesarCompra({ carrito: [{ codigo: 'TF-NB-004', qty: 1 }], cliente: CLIENTE, entrega: ENTREGA_RETIRO })
    procesarCompra({ carrito: [{ codigo: 'TF-NB-004', qty: 1 }], cliente: CLIENTE, entrega: ENTREGA_RETIRO, resultadoPago: 'rechazado' })
    entrarComoAdmin()
    render(vista(AdminReportes, { ruta: '/admin/reportes' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Reportes' })).toBeInTheDocument()
    for (const indicador of ['Órdenes pagadas', 'Órdenes con error de pago', 'Unidades vendidas', 'Total vendido', 'Ticket promedio']) {
      expect(screen.getByText(indicador)).toBeInTheDocument()
    }
    expect(screen.getAllByText('$1.044.990')).toHaveLength(2) // total vendido y ticket promedio
    expect(screen.getByText('1 u. · $1.044.990')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Usuarios por tipo' })).toBeInTheDocument()
    expect(await screen.findByText('Vendedor')).toBeInTheDocument()
    expect(listarUsuarios).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Descargar órdenes en CSV' }))
    const texto = await archivo.text()
    expect(texto).toContain('"N° boleta","Código","Fecha","Cliente","Correo","Estado","Total"')
    expect(texto).toContain('"Pedro Hacker","pedro@duocuc.cl","Pagada","1044990"')
  })
})
