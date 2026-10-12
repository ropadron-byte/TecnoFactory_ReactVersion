import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Ofertas from '../pages/Ofertas.jsx'
import { vista } from './helpers.jsx'

describe('Vista Ofertas', () => {
  it('muestra solo los productos con descuento, del mayor al menor', () => {
    render(vista(Ofertas, { ruta: '/ofertas' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Productos en oferta' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(7)
    expect(screen.queryByText('iPhone 5s')).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Vivo X21',
      'Realme C35',
      'iPhone X',
      'New DELL XPS 13 9300 Laptop',
      'Asus Zenbook Pro Dual Screen Laptop',
      'iPhone 6',
      'Vivo S1',
    ])
    expect(screen.getByText('-25%')).toBeInTheDocument()
    expect(screen.getByText('-20%')).toBeInTheDocument()
  })
})
