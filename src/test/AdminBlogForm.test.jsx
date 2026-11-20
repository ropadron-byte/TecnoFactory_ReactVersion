import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminNuevoBlog from '../pages/admin/AdminNuevoBlog.jsx'
import AdminEditarBlog from '../pages/admin/AdminEditarBlog.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

vi.mock('../services/blogsApi.js', () => ({
  crearBlog: vi.fn(),
  actualizarBlog: vi.fn(),
  buscarBlogGestion: vi.fn(),
  cambiarPortada: vi.fn(),
  quitarImagen: vi.fn(),
  subirImagenBlog: vi.fn(),
  agregarImagenExistente: vi.fn(),
}))
vi.mock('../services/imagenesApi.js', () => ({ listarImagenes: vi.fn() }))
import {
  actualizarBlog,
  buscarBlogGestion,
  cambiarPortada,
  crearBlog,
  quitarImagen,
} from '../services/blogsApi'
import { listarImagenes } from '../services/imagenesApi'

const BLOG = {
  id: 7,
  titulo: 'Borrador interno',
  contenido: 'Contenido inicial del blog.',
  visible: false,
  imagenPrincipal: null,
  imagenes: [
    { id: 10, url: 'http://localhost:8080/uploads/blog/uno.jpg' },
    { id: 11, url: 'http://localhost:8080/uploads/blog/dos.jpg' },
  ],
  autorNombre: 'Admin Tecno Factory',
  fechaCreacion: '2026-08-12T10:00:00',
}

beforeEach(() => {
  vi.clearAllMocks()
  listarImagenes.mockResolvedValue([])
  crearBlog.mockResolvedValue(BLOG)
  actualizarBlog.mockResolvedValue(BLOG)
  buscarBlogGestion.mockResolvedValue(BLOG)
  cambiarPortada.mockResolvedValue(BLOG)
  quitarImagen.mockResolvedValue({ id: 10, url: '' })
})

describe('Formularios de blogs (componentes conectados a la API)', () => {
  it('valida y crea un blog en el servidor', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminNuevoBlog, { ruta: '/admin/blogs/nuevo' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Nuevo blog' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Crear blog' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(crearBlog).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Título'), 'Nueva publicación')
    await user.type(screen.getByLabelText('Contenido'), 'Texto del artículo.')
    await user.click(screen.getByRole('button', { name: 'Crear blog' }))

    await waitFor(() => expect(crearBlog).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Nueva publicación',
      contenido: 'Texto del artículo.',
      visible: true,
    })))
    expect(await screen.findByRole('alert')).toHaveTextContent('Blog creado correctamente en el servidor.')
  })

  it('edita el blog y gestiona su galería desde el detalle de la API', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminEditarBlog, {
      ruta: '/admin/blogs/7/editar',
      patron: '/admin/blogs/:id/editar',
      datos: BLOG,
    }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Galería y portada' })).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Título'))
    await user.type(screen.getByLabelText('Título'), 'Título corregido')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(actualizarBlog).toHaveBeenCalledWith(7, expect.objectContaining({
      titulo: 'Título corregido',
      visible: false,
    })))

    await user.click(screen.getAllByRole('button', { name: 'Usar como portada' })[0])
    await waitFor(() => expect(cambiarPortada).toHaveBeenCalledWith(7, 10))

    await user.click(screen.getAllByRole('button', { name: 'Quitar' })[0])
    await waitFor(() => expect(quitarImagen).toHaveBeenCalledWith(7, 10))
  })
})
