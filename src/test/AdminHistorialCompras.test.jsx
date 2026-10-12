import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminHistorialCompras from '../pages/admin/AdminHistorialCompras.jsx'
import { ENTREGA_RETIRO, entrarComoAdmin, vista } from './helpers.jsx'
import { procesarCompra } from '../services/ordenesService'
import { obtenerUsuarioPorId } from '../services/usuariosService'

const comprar = (resultadoPago) =>
  procesarCompra({
    carrito: [{ codigo: 'TF-NB-004', qty: 1 }],
    usuarioId: 1,
    cliente: { nombre: 'Admin', apellidos: 'Tecno Factory', correo: 'admin@duoc.cl' },
    entrega: ENTREGA_RETIRO,
    resultadoPago,
  })

describe('Vista AdminHistorialCompras', () => {
  it('lista las compras del usuario, suma solo las pagadas y permite volver al usuario', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    comprar('exitoso')
    comprar('rechazado')
    render(vista(AdminHistorialCompras, { ruta: '/admin/usuarios/1/compras', patron: '/admin/usuarios/:id/compras', datos: obtenerUsuarioPorId(1) }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Compras de Admin Tecno Factory' })).toBeInTheDocument()
    expect(screen.getByText(/2 orden\(es\)/)).toBeInTheDocument()
    expect(screen.getAllByText('$1.044.990')).toHaveLength(3) // total pagado + 2 filas
    expect(screen.getAllByRole('link', { name: 'Ver boleta' })).toHaveLength(2)

    await user.click(screen.getByRole('link', { name: '← Volver al usuario' }))
    expect(screen.getByText('Destino: /admin/usuarios/1')).toBeInTheDocument()
  })
})
