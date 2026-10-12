import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Productos from '../pages/Productos.jsx'
import { vista } from './helpers.jsx'

describe('Vista Productos', () => {
  it('muestra el catálogo y permite filtrar por categoría, buscar y ordenar', async () => {
    const user = userEvent.setup()
    render(vista(Productos, { ruta: '/productos' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Todos nuestros productos' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(21)

    await user.click(screen.getByRole('button', { name: 'Notebooks' }))
    expect(screen.getAllByRole('article')).toHaveLength(5)
    expect(screen.queryByText('iPhone 5s')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Buscar productos'), 'YOGA')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Lenovo Yoga 920')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar productos'))
    await user.selectOptions(screen.getByLabelText('Ordenar productos'), 'precio-asc')
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Lenovo Yoga 920')

    await user.click(screen.getByRole('button', { name: 'Audio' }))
    expect(screen.getByText('No encontramos productos con esos filtros.')).toBeInTheDocument()
  })
})
