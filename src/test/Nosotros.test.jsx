import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Nosotros from '../pages/Nosotros.jsx'
import { vista } from './helpers.jsx'

describe('Vista Nosotros', () => {
  it('muestra el título, las cuatro secciones y las listas del equipo y motivos', () => {
    render(vista(Nosotros, { ruta: '/nosotros' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Quiénes somos' })).toBeInTheDocument()
    for (const seccion of ['Nuestra historia', 'Nuestra misión', 'Nuestro equipo', '¿Por qué elegirnos?']) {
      expect(screen.getByRole('heading', { level: 2, name: seccion })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getByText('Atención a clientes y soporte post-venta.')).toBeInTheDocument()
  })
})
