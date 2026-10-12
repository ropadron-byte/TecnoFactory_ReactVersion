import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNuevoProducto from '../pages/admin/AdminNuevoProducto.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerProductoPorCodigo, obtenerProductos } from '../services/productosService'

describe('Vista AdminNuevoProducto', () => {
  it('valida el formulario, rechaza un descuento inválido y guarda el producto', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminNuevoProducto, { ruta: '/admin/productos/nuevo' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo producto' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(obtenerProductos()).toHaveLength(21)

    await user.type(screen.getByLabelText('Código producto'), 'TF-TEST-1')
    await user.type(screen.getByLabelText('Nombre'), 'Mouse de prueba')
    await user.type(screen.getByLabelText('Precio'), '10000')
    await user.type(screen.getByLabelText('Stock'), '5')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Accesorios')
    await user.type(screen.getByLabelText('Descuento (%)'), '150')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))
    expect(screen.getByLabelText('Descuento (%)')).toHaveClass('is-invalid')
    expect(obtenerProductoPorCodigo('TF-TEST-1')).toBeUndefined()

    await user.clear(screen.getByLabelText('Descuento (%)'))
    await user.type(screen.getByLabelText('Descuento (%)'), '20')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Producto guardado correctamente.')
    expect(obtenerProductoPorCodigo('TF-TEST-1')).toMatchObject({ precio: 10000, stock: 5, descuento: 20, categoria: 'Accesorios' })
    expect(await screen.findByText('Destino: /admin/productos')).toBeInTheDocument()
  })
})
