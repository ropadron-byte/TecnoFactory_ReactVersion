import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNuevaCategoria from '../pages/admin/AdminNuevaCategoria.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { ApiError } from '../services/api'

vi.mock('../services/categoriasApi.js', () => ({
  crearCategoria: vi.fn(),
  editarCategoria: vi.fn(),
  borrarCategoria: vi.fn(),
}))
import { crearCategoria } from '../services/categoriasApi'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('tf_categorias', JSON.stringify([{ id: 1, nombre: 'Notebooks', descripcion: 'Equipos', imagen: '' }]))
})

describe('Vista AdminNuevaCategoria', () => {
  it('exige nombre y descripción, muestra el error del backend y crea la categoría', async () => {
    const user = userEvent.setup()
    crearCategoria
      .mockRejectedValueOnce(new ApiError(403, 'No tienes permiso para hacer esto.'))
      .mockResolvedValue({ id: 11, nombre: 'Audio' })
    entrarComoAdmin()
    render(vista(AdminNuevaCategoria, { ruta: '/admin/categorias/nueva' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Nueva categoría' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    // La descripción es obligatoria: el backend no acepta una categoría sin ella
    await user.type(screen.getByLabelText('Nombre'), 'Audio')
    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(screen.getByLabelText('Descripción')).toHaveClass('is-invalid')
    expect(crearCategoria).not.toHaveBeenCalled()

    // No deja repetir un nombre que ya existe
    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'notebooks')
    await user.type(screen.getByLabelText('Descripción'), 'Parlantes y audífonos')
    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una categoría con ese nombre.')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Audio')
    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para hacer esto.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar categoría' })).toBeEnabled())

    await user.click(screen.getByRole('button', { name: 'Guardar categoría' }))
    expect(await screen.findByText('Categoría guardada correctamente.')).toBeInTheDocument()
    expect(crearCategoria).toHaveBeenLastCalledWith({ nombre: 'Audio', descripcion: 'Parlantes y audífonos', imagen: '' })
    expect(await screen.findByText('Destino: /admin/categorias')).toBeInTheDocument()
  })
})
