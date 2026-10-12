import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetalleBlog from '../pages/DetalleBlog.jsx'
import { vista } from './helpers.jsx'
import { BLOGS } from '../data/blogs'

describe('Vista DetalleBlog', () => {
  it('muestra el artículo con su fecha, imagen y contenido, y permite volver al listado', async () => {
    const user = userEvent.setup()
    const blog = BLOGS.find((b) => b.slug === '5-datos-curiosos-ssd')
    render(vista(DetalleBlog, { ruta: `/blogs/${blog.slug}`, patron: '/blogs/:slug', datos: blog }))

    expect(await screen.findByRole('heading', { level: 1, name: '5 datos curiosos sobre el SSD' })).toBeInTheDocument()
    expect(screen.getByText(/28 AGO 2026/)).toBeInTheDocument()
    expect(screen.getByText(/CURIOSIDADES/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Disco de estado sólido' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '5 datos curiosos sobre los SSD que quizás no conocías' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '1. No es un invento reciente' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '← Volver al listado de blogs' }))
    expect(screen.getByText('Destino: /blogs')).toBeInTheDocument()
  })
})
