import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminBlogs from '../pages/admin/AdminBlogs.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

vi.mock('../services/blogsApi.js', () => ({
  listarBlogsGestion: vi.fn(),
  desactivarBlog: vi.fn(),
  activarBlog: vi.fn(),
  eliminarBlog: vi.fn(),
}))
import { activarBlog, desactivarBlog, eliminarBlog, listarBlogsGestion } from '../services/blogsApi'

const PUBLICADO = {
  id: 7,
  titulo: 'Abrimos la tienda online',
  autorNombre: 'Admin Tecno Factory',
  fechaCreacion: '2026-08-12T10:00:00',
  visible: true,
  imagenPrincipal: { id: 1, url: 'http://localhost:8080/uploads/blog/portada.jpg' },
}
const OCULTO = {
  id: 8,
  titulo: 'Borrador interno',
  autorNombre: 'Vera Rojas',
  fechaCreacion: '2026-08-28T10:00:00',
  visible: false,
  imagenPrincipal: null,
}

const confirmOriginal = window.confirm
afterEach(() => {
  window.confirm = confirmOriginal
})

beforeEach(() => {
  vi.clearAllMocks()
  listarBlogsGestion.mockResolvedValue([PUBLICADO, OCULTO])
  desactivarBlog.mockResolvedValue({ ...PUBLICADO, visible: false })
  activarBlog.mockResolvedValue({ ...OCULTO, visible: true })
  eliminarBlog.mockResolvedValue(undefined)
})

describe('Vista AdminBlogs (gestión desde la API)', () => {
  it('lista los blogs, desactiva uno y recarga la tabla', async () => {
    const user = userEvent.setup()
    window.confirm = () => true
    entrarComoAdmin()
    render(vista(AdminBlogs, { ruta: '/admin/blogs' }))

    expect(await screen.findByText('Abrimos la tienda online')).toBeInTheDocument()
    expect(screen.getByText('Borrador interno')).toBeInTheDocument()
    expect(screen.getByText('Publicado')).toBeInTheDocument()
    expect(screen.getByText('Desactivado')).toBeInTheDocument()
    expect(listarBlogsGestion).toHaveBeenCalledTimes(1)

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[0])
    await waitFor(() => expect(desactivarBlog).toHaveBeenCalledWith(7))
    expect(screen.getByRole('alert')).toHaveTextContent('Blog desactivado.')
    expect(listarBlogsGestion).toHaveBeenCalledTimes(2)
  })

  it('activa un blog oculto y elimina otro', async () => {
    const user = userEvent.setup()
    window.confirm = () => true
    entrarComoAdmin()
    render(vista(AdminBlogs, { ruta: '/admin/blogs' }))

    expect(await screen.findByText('Borrador interno')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activar' }))
    await waitFor(() => expect(activarBlog).toHaveBeenCalledWith(8))

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    await waitFor(() => expect(eliminarBlog).toHaveBeenCalledWith(7))
    expect(screen.getByRole('alert')).toHaveTextContent('Blog eliminado.')
  })
})
