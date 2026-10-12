import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Checkout from '../pages/Checkout.jsx'
import { vista } from './helpers.jsx'
import { addToCart, getCart } from '../services/carritoService'
import { obtenerOrdenes } from '../services/ordenesService'
import { obtenerProductoPorCodigo } from '../services/productosService'

describe('Vista Checkout', () => {
  it('valida el formulario, alterna la entrega y registra la compra pagada', async () => {
    const user = userEvent.setup()
    addToCart('TF-NB-004', 2)
    render(vista(Checkout, { ruta: '/checkout' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Finalizar compra' })).toBeInTheDocument()
    expect(screen.getByText('Total a pagar: $2.089.980')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(screen.getByLabelText('Nombre *')).toHaveClass('is-invalid')

    await user.click(screen.getByRole('radio', { name: 'Retiro en tienda' }))
    expect(screen.queryByLabelText('Calle *')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Despacho a domicilio' }))

    await user.type(screen.getByLabelText('Nombre *'), 'Pedro')
    await user.type(screen.getByLabelText('Apellidos *'), 'Hacker')
    await user.type(screen.getByLabelText('Correo *'), 'pedro@gmail.com')
    await user.type(screen.getByLabelText('Calle *'), 'Los Olmos 45')
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.click(screen.getByRole('button', { name: /Pagar ahora/ }))

    expect(await screen.findByText('Destino: /compra/exitosa/1')).toBeInTheDocument()
    expect(obtenerOrdenes()[0]).toMatchObject({ estado: 'Pagada', cliente: { nombre: 'Pedro', correo: 'pedro@gmail.com' } })
    expect(getCart()).toEqual([])
    expect(obtenerProductoPorCodigo('TF-NB-004').stock).toBe(38)
  })
})
