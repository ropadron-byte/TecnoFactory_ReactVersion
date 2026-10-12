import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompraExitosa from '../pages/CompraExitosa.jsx'
import { CLIENTE, ENTREGA_RETIRO, vista } from './helpers.jsx'
import { procesarCompra } from '../services/ordenesService'

const imprimirOriginal = window.print
afterEach(() => {
  window.print = imprimirOriginal
})

describe('Vista CompraExitosa', () => {
  it('muestra el resumen de la compra, permite imprimir o enviar la boleta y seguir comprando', async () => {
    const user = userEvent.setup()
    let impreso = false
    window.print = () => {
      impreso = true
    }
    const { orden } = procesarCompra({ carrito: [{ codigo: 'TF-NB-004', qty: 1 }], cliente: CLIENTE, entrega: ENTREGA_RETIRO })
    render(vista(CompraExitosa, { ruta: `/compra/exitosa/${orden.id}`, patron: '/compra/exitosa/:id', datos: orden }))

    expect(await screen.findByRole('heading', { level: 1, name: `✅ Se ha realizado la compra. nro #${orden.numero}` })).toBeInTheDocument()
    expect(screen.getByText(`Código orden: ${orden.codigo}`)).toBeInTheDocument()
    expect(screen.getByText('Puedes imprimir tu boleta o enviarla a pedro@gmail.com.')).toBeInTheDocument()
    expect(screen.getByText('Pedro Hacker')).toBeInTheDocument()
    expect(screen.getByText('Lenovo Yoga 920')).toBeInTheDocument()
    expect(screen.getByText('Total pagado: $1.044.990')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enviar boleta por email' })).toHaveAttribute('href', expect.stringContaining('mailto:pedro@gmail.com'))

    await user.click(screen.getByRole('button', { name: 'Imprimir boleta en PDF' }))
    expect(impreso).toBe(true)

    await user.click(screen.getByRole('link', { name: 'Seguir comprando' }))
    expect(screen.getByText('Destino: /productos')).toBeInTheDocument()
  })
})
