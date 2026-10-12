import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminProductosCriticos from '../pages/admin/AdminProductosCriticos.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

describe('Vista AdminProductosCriticos', () => {
  it('muestra solo los productos con stock crítico y permite volver a productos', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminProductosCriticos, { ruta: '/admin/productos/criticos' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Productos críticos' })).toBeInTheDocument()
    expect(screen.getByText('Samsung Galaxy S8')).toBeInTheDocument()
    expect(screen.getByText('Sin stock')).toBeInTheDocument()
    expect(screen.queryByText('Lenovo Yoga 920')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/admin/productos/TF-SP-012/editar')

    await user.click(screen.getByRole('link', { name: '← Volver a productos' }))
    expect(screen.getByText('Destino: /admin/productos')).toBeInTheDocument()
  })
})
