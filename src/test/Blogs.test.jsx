import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Blogs from '../pages/Blogs.jsx'
import { vista } from './helpers.jsx'

describe('Vista Blogs', () => {
  it('lista los artículos, marca el que aún no está disponible y abre uno', async () => {
    const user = userEvent.setup()
    render(vista(Blogs, { ruta: '/blogs' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Novedades y curiosidades tecno' })).toBeInTheDocument()
    for (const titulo of ['Abrimos nuestra tienda online', '5 datos curiosos sobre el SSD', 'Guía para armar tu setup ideal']) {
      expect(screen.getByRole('heading', { level: 3, name: titulo })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('link', { name: 'Leer más' })).toHaveLength(2)
    expect(screen.getByText('Próximamente')).toBeInTheDocument()

    await user.click(screen.getAllByRole('link', { name: 'Leer más' })[0])
    expect(screen.getByText('Destino: /blogs/abrimos-nuestra-tienda-online')).toBeInTheDocument()
  })
})
