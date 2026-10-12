import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminProductos from '../pages/admin/AdminProductos.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerProductoPorCodigo } from '../services/productosService'

const confirmOriginal = window.confirm
afterEach(() => {
  window.confirm = confirmOriginal
})

describe('Vista AdminProductos', () => {
  it('lista el catálogo con acciones de administrador y elimina un producto solo si se confirma', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminProductos, { ruta: '/admin/productos' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Productos' })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(22) // encabezado + 21
    expect(screen.getByText('Sin stock')).toBeInTheDocument()
    for (const enlace of ['+ Nuevo producto', 'Productos críticos', 'Reportes']) {
      expect(screen.getByRole('link', { name: enlace })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('link', { name: 'Editar' })).toHaveLength(21)

    window.confirm = () => false
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    expect(screen.getByText('iPhone 5s')).toBeInTheDocument()

    window.confirm = () => true
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    expect(screen.queryByText('iPhone 5s')).not.toBeInTheDocument()
    expect(obtenerProductoPorCodigo('TF-SP-001')).toBeUndefined()

    await user.click(screen.getByRole('link', { name: '+ Nuevo producto' }))
    expect(screen.getByText('Destino: /admin/productos/nuevo')).toBeInTheDocument()
  })
})
