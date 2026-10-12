import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminReportesProductos from '../pages/admin/AdminReportesProductos.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'

const createOriginal = URL.createObjectURL
const revokeOriginal = URL.revokeObjectURL
afterEach(() => {
  URL.createObjectURL = createOriginal
  URL.revokeObjectURL = revokeOriginal
})

describe('Vista AdminReportesProductos', () => {
  it('resume el inventario, lo desglosa por categoría, descarga el CSV y enlaza a críticos', async () => {
    const user = userEvent.setup()
    let archivo = null
    URL.createObjectURL = (blob) => {
      archivo = blob
      return 'blob:productos'
    }
    URL.revokeObjectURL = () => {}
    entrarComoAdmin()
    render(vista(AdminReportesProductos, { ruta: '/admin/productos/reportes' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Reporte de productos' })).toBeInTheDocument()
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual(['21', '953', '$603.639.964', '7', '1', '1'])
    expect(screen.getByText('$344.496.113 · 258 u.')).toBeInTheDocument()
    expect(screen.getByText('$259.143.851 · 695 u.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Descargar CSV' }))
    const texto = await archivo.text()
    expect(texto).toContain('"Código","Nombre","Categoría"')
    expect(texto).toContain('"TF-NB-004","Lenovo Yoga 920","Notebooks","1044990"')

    await user.click(screen.getByRole('link', { name: 'Ver productos críticos' }))
    expect(screen.getByText('Destino: /admin/productos/criticos')).toBeInTheDocument()
  })
})
