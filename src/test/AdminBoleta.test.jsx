import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminBoleta from '../pages/admin/AdminBoleta.jsx'
import { ADMIN_SESION, entrarComoAdmin, vista } from './helpers.jsx'
import { guardarSesion } from '../services/usuariosService'
import { ApiError } from '../services/api'

vi.mock('../services/boletasApi.js', () => ({
  anularBoleta: vi.fn(),
  sincronizarBoletas: vi.fn(),
}))
import { anularBoleta } from '../services/boletasApi'

const ORDEN = {
  id: 5,
  numero: '5',
  codigo: 'ORDER00005',
  fecha: '2026-11-20T12:00:00',
  estado: 'Pagada',
  usuarioId: 2,
  cliente: { nombre: 'Cliente', apellidos: 'Prueba', correo: 'cliente.prueba@example.com' },
  entrega: { tipo: 'retiro', calle: '', departamento: '', region: '', comuna: '', indicaciones: 'Preguntar por Pedro' },
  items: [{ codigo: '20', nombre: 'Lenovo Yoga 920', imagen: '', precio: 1044990, qty: 2, subtotal: 2089980 }],
  total: 2089980,
}
const abrir = (orden = ORDEN) => render(vista(AdminBoleta, { ruta: '/admin/ordenes/5', patron: '/admin/ordenes/:id', datos: orden }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Vista AdminBoleta', () => {
  it('el administrador anula una boleta pagada y la pantalla pasa a "Anulada"', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    anularBoleta.mockResolvedValue({ ...ORDEN, estado: 'Anulada' })
    entrarComoAdmin()
    abrir()

    expect(await screen.findByRole('heading', { level: 1, name: 'Boleta #5' })).toBeInTheDocument()
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByText('Total pagado: $2.089.980')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anular boleta' }))

    expect(await screen.findByText('Boleta anulada. El stock de sus productos fue devuelto.')).toBeInTheDocument()
    expect(anularBoleta).toHaveBeenCalledWith(5)
    expect(screen.getByText('Anulada')).toBeInTheDocument()
    expect(screen.getByText('Total anulado: $2.089.980')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Anular boleta' })).not.toBeInTheDocument()
  })

  it('si el backend rechaza la anulación muestra su mensaje y la boleta sigue pagada', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    anularBoleta.mockRejectedValue(new ApiError(409, 'La boleta ya está anulada'))
    entrarComoAdmin()
    abrir()

    await user.click(await screen.findByRole('button', { name: 'Anular boleta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La boleta ya está anulada')
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anular boleta' })).toBeEnabled()
  })

  it('el vendedor ve la boleta pero no puede anularla', async () => {
    guardarSesion({ ...ADMIN_SESION, tipo: 'Vendedor' })
    abrir()

    expect(await screen.findByRole('heading', { level: 1, name: 'Boleta #5' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Anular boleta' })).not.toBeInTheDocument()
  })

  it('una boleta de otro equipo muestra que la entrega y el correo no están disponibles', async () => {
    entrarComoAdmin()
    abrir({ ...ORDEN, cliente: { nombre: 'Cliente', apellidos: '#2', correo: '' }, entrega: { tipo: 'no-registrada' } })

    expect(await screen.findByText(/Los datos de entrega no se guardan en el servidor/)).toBeInTheDocument()
    expect(screen.getByText('No disponible')).toBeInTheDocument()
  })
})
