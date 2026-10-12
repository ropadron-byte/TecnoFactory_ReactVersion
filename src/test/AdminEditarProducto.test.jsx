import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminEditarProducto from '../pages/admin/AdminEditarProducto.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerProductoPorCodigo } from '../services/productosService'

describe('Vista AdminEditarProducto', () => {
  it('carga el producto con el código bloqueado, valida el nombre y guarda los cambios', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminEditarProducto, { ruta: '/admin/productos/TF-NB-004/editar', patron: '/admin/productos/:codigo/editar', datos: obtenerProductoPorCodigo('TF-NB-004') }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Editar producto' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Lenovo Yoga 920')
    expect(screen.getByLabelText('Precio')).toHaveValue(1044990)
    expect(screen.getByLabelText('Categoría')).toHaveValue('Notebooks')
    expect(screen.getByLabelText('Código producto')).toHaveAttribute('readonly')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(obtenerProductoPorCodigo('TF-NB-004').nombre).toBe('Lenovo Yoga 920')

    await user.type(screen.getByLabelText('Nombre'), 'Yoga Pro')
    await user.clear(screen.getByLabelText('Precio'))
    await user.type(screen.getByLabelText('Precio'), '999990')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Producto actualizado correctamente.')
    expect(obtenerProductoPorCodigo('TF-NB-004')).toMatchObject({ nombre: 'Yoga Pro', precio: 999990, codigo: 'TF-NB-004' })
    expect(await screen.findByText('Destino: /admin/productos')).toBeInTheDocument()
  })
})
