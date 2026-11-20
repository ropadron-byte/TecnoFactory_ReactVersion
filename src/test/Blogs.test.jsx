import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Blogs from '../pages/Blogs.jsx'
import { vista } from './helpers.jsx'
import { urlImagen } from '../utils/imagenes'

vi.mock('../services/blogsApi.js', () => ({ listarBlogs: vi.fn() }))
import { listarBlogs } from '../services/blogsApi'

const BLOGS_API = [
  {
    id: 7,
    titulo: 'Abrimos la tienda online',
    fechaCreacion: '2026-08-12T10:00:00',
    imagenPrincipal: { id: 1, url: '/uploads/blog/portada.jpg' },
  },
  {
    id: 8,
    titulo: '5 datos curiosos sobre el SSD',
    fechaCreacion: '2026-08-28T10:00:00',
    imagenPrincipal: null,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  listarBlogs.mockResolvedValue(BLOGS_API)
})

describe('Vista Blogs (desde la API)', () => {
  it('lista las publicaciones de la API y abre una por su id', async () => {
    const user = userEvent.setup()
    render(vista(Blogs, { ruta: '/blogs' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Novedades y curiosidades tecno' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 3, name: 'Abrimos la tienda online' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '5 datos curiosos sobre el SSD' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Abrimos la tienda online' })).toHaveAttribute('src', urlImagen(BLOGS_API[0].imagenPrincipal.url))
    expect(screen.getAllByRole('link', { name: 'Leer más' })).toHaveLength(2)
    expect(listarBlogs).toHaveBeenCalled()

    await user.click(screen.getAllByRole('link', { name: 'Leer más' })[0])
    expect(screen.getByText('Destino: /blogs/7')).toBeInTheDocument()
  })

  it('muestra el error cuando la API no responde', async () => {
    listarBlogs.mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.'))
    render(vista(Blogs, { ruta: '/blogs' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor.')
  })
})
