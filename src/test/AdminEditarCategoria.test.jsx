import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminEditarCategoria from '../pages/admin/AdminEditarCategoria.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerCategoriaPorId } from '../services/categoriasService'
import { obtenerProductoPorCodigo } from '../services/productosService'

describe('Vista AdminEditarCategoria', () => {
  it('carga la categoría, valida el nombre y al renombrar actualiza sus productos', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminEditarCategoria, { ruta: '/admin/categorias/1/editar', patron: '/admin/categorias/:id/editar', datos: obtenerCategoriaPorId(1) }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Editar categoría' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Notebooks')
    expect(screen.getByLabelText('Descripción')).toHaveValue('Equipos portátiles para estudio, trabajo y diseño.')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    await user.type(screen.getByLabelText('Nombre'), 'Audio')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una categoría con ese nombre.')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Portátiles')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Categoría actualizada correctamente.')
    expect(obtenerCategoriaPorId(1).nombre).toBe('Portátiles')
    expect(obtenerProductoPorCodigo('TF-NB-004').categoria).toBe('Portátiles')
    expect(await screen.findByText('Destino: /admin/categorias')).toBeInTheDocument()
  })
})
