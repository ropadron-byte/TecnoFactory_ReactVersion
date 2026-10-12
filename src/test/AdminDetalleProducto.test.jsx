import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDetalleProducto from '../pages/admin/AdminDetalleProducto.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerProductoPorCodigo } from '../services/productosService'

describe('Vista AdminDetalleProducto', () => {
  it('muestra los datos del producto, ofrece editar al administrador y permite volver', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminDetalleProducto, { ruta: '/admin/productos/TF-NB-004', patron: '/admin/productos/:codigo', datos: obtenerProductoPorCodigo('TF-NB-004') }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lenovo Yoga 920' })).toBeInTheDocument()
    expect(screen.getByText('TF-NB-004')).toBeInTheDocument()
    expect(screen.getByText('$1.044.990')).toBeInTheDocument()
    expect(screen.getByText('40 unidades')).toBeInTheDocument()
    expect(screen.getByText('5 unidades')).toBeInTheDocument()
    expect(screen.queryByText('Precio con oferta')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/admin/productos/TF-NB-004/editar')

    await user.click(screen.getByRole('link', { name: '← Volver al listado' }))
    expect(screen.getByText('Destino: /admin/productos')).toBeInTheDocument()
  })
})
