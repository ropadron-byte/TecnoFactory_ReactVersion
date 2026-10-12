import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNuevaCategoria from '../pages/admin/AdminNuevaCategoria.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerCategorias } from '../services/categoriasService'

describe('Vista AdminNuevaCategoria', () => {
  it('valida el nombre, rechaza duplicados y guarda la categoría', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminNuevaCategoria, { ruta: '/admin/categorias/nueva' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Nueva categoría' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    await user.type(screen.getByLabelText('Nombre'), 'notebooks')
    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una categoría con ese nombre.')
    expect(obtenerCategorias()).toHaveLength(6)

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Gamer')
    await user.type(screen.getByLabelText('Descripción'), 'Equipos para jugar')
    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Categoría guardada correctamente.')
    expect(obtenerCategorias().find((c) => c.nombre === 'Gamer')).toMatchObject({ descripcion: 'Equipos para jugar' })
    expect(await screen.findByText('Destino: /admin/categorias')).toBeInTheDocument()
  })
})
