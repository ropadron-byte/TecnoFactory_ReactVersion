import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminImagenes from '../pages/admin/AdminImagenes.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

vi.mock('../services/imagenesApi.js', () => ({
  listarImagenes: vi.fn(),
  subirImagen: vi.fn(),
  reemplazarImagen: vi.fn(),
  eliminarImagen: vi.fn(),
  desacoplarImagenDeTodos: vi.fn(),
  desacoplarImagenDe: vi.fn(),
}))
import {
  desacoplarImagenDe,
  desacoplarImagenDeTodos,
  eliminarImagen,
  listarImagenes,
  reemplazarImagen,
  subirImagen,
} from '../services/imagenesApi'

const EN_USO = {
  id: 10,
  url: '/uploads/blog/portada.jpg',
  duenos: [
    { tipo: 'BLOG', id: 7 },
    { tipo: 'PRODUCTO', id: 3 },
  ],
}
const LIBRE = { id: 11, url: '/uploads/productos/teclado.png', duenos: [] }

const confirmOriginal = window.confirm
afterEach(() => {
  window.confirm = confirmOriginal
})

beforeEach(() => {
  vi.clearAllMocks()
  listarImagenes.mockResolvedValue([EN_USO, LIBRE])
  subirImagen.mockResolvedValue(LIBRE)
  reemplazarImagen.mockResolvedValue(EN_USO)
  eliminarImagen.mockResolvedValue(undefined)
  desacoplarImagenDeTodos.mockResolvedValue(LIBRE)
  desacoplarImagenDe.mockResolvedValue(LIBRE)
})

describe('Vista AdminImagenes (catálogo desde la API)', () => {
  it('lista las imágenes con sus dueños y permite filtrar las que están libres', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminImagenes, { ruta: '/admin/imagenes' }))

    expect(await screen.findByText('Imagen #10')).toBeInTheDocument()
    expect(screen.getByText('Imagen #11')).toBeInTheDocument()
    expect(screen.getByText('BLOG #7')).toBeInTheDocument()
    expect(screen.getByText('PRODUCTO #3')).toBeInTheDocument()
    expect(screen.getByText('2 uso(s)')).toBeInTheDocument()
    expect(screen.getByText('Sin relaciones.')).toBeInTheDocument()
    expect(listarImagenes).toHaveBeenCalledTimes(1)

    await user.selectOptions(screen.getByLabelText('Filtrar por uso'), 'libre')
    expect(screen.queryByText('Imagen #10')).not.toBeInTheDocument()
    expect(screen.getByText('Imagen #11')).toBeInTheDocument()
  })

  it('sube una imagen con el destino elegido y recarga el catálogo', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminImagenes, { ruta: '/admin/imagenes' }))

    expect(await screen.findByText('Imagen #10')).toBeInTheDocument()
    const archivo = new File(['contenido'], 'teclado.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Archivo de imagen'), archivo)
    await user.selectOptions(screen.getByLabelText('Destino'), 'productos')
    await user.click(screen.getByRole('button', { name: 'Subir imagen' }))

    await waitFor(() => expect(subirImagen).toHaveBeenCalledWith(expect.any(File), 'productos'))
    expect(screen.getByRole('alert')).toHaveTextContent('Imagen subida al catálogo.')
    expect(listarImagenes).toHaveBeenCalledTimes(2)
  })

  it('reemplaza el archivo, desacopla dueños y elimina la imagen', async () => {
    const user = userEvent.setup()
    window.confirm = () => true
    entrarComoAdmin()
    render(vista(AdminImagenes, { ruta: '/admin/imagenes' }))

    expect(await screen.findByText('Imagen #10')).toBeInTheDocument()
    const archivo = new File(['nuevo'], 'nueva.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Archivo de reemplazo de la imagen 10'), archivo)
    await user.click(screen.getByRole('button', { name: 'Reemplazar imagen 10' }))
    await waitFor(() => expect(reemplazarImagen).toHaveBeenCalledWith(10, expect.any(File)))

    await user.click(screen.getByRole('button', { name: 'Quitar BLOG 7 de la imagen 10' }))
    await waitFor(() => expect(desacoplarImagenDe).toHaveBeenCalledWith(10, 'BLOG', 7))

    await user.click(screen.getByRole('button', { name: 'Desacoplar imagen 10 de todos' }))
    await waitFor(() => expect(desacoplarImagenDeTodos).toHaveBeenCalledWith(10))

    await user.click(screen.getByRole('button', { name: 'Eliminar imagen 10' }))
    await waitFor(() => expect(eliminarImagen).toHaveBeenCalledWith(10))
  })
})
