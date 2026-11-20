import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetalleBlog from '../pages/DetalleBlog.jsx'
import { vista } from './helpers.jsx'

const BLOG = {
  id: 7,
  titulo: '5 datos curiosos sobre el SSD',
  contenido: 'Primer párrafo del artículo.\n\nSegundo párrafo del artículo.',
  fechaCreacion: '2026-08-28T10:00:00',
  imagenPrincipal: { id: 10, url: 'http://localhost:8080/uploads/blog/portada.jpg' },
  imagenes: [
    { id: 10, url: 'http://localhost:8080/uploads/blog/portada.jpg' },
    { id: 11, url: 'http://localhost:8080/uploads/blog/detalle.jpg' },
  ],
}

describe('Vista DetalleBlog (datos de la API)', () => {
  it('muestra el contenido, la portada, la galería y permite volver al listado', async () => {
    const user = userEvent.setup()
    render(vista(DetalleBlog, { ruta: '/blogs/7', patron: '/blogs/:id', datos: BLOG }))

    expect(await screen.findByRole('heading', { level: 1, name: '5 datos curiosos sobre el SSD' })).toBeInTheDocument()
    expect(screen.getByText(/28 AGO 2026/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '5 datos curiosos sobre el SSD' })).toHaveAttribute('src', BLOG.imagenPrincipal.url)
    expect(screen.getByText('Primer párrafo del artículo.')).toBeInTheDocument()
    expect(screen.getByText('Segundo párrafo del artículo.')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /Imagen de/ })).toHaveLength(2)

    await user.click(screen.getByRole('link', { name: '← Volver al listado de blogs' }))
    expect(screen.getByText('Destino: /blogs')).toBeInTheDocument()
  })
})
