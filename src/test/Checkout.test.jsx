import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Checkout from '../pages/Checkout.jsx'
import { vista } from './helpers.jsx'
import { API_V1, guardarToken } from '../services/api'
import { addToCart, getCart } from '../services/carritoService'
import { obtenerOrdenes } from '../services/ordenesService'
import { obtenerProductoPorCodigo } from '../services/productosService'

// Notebook del catálogo (formato de la tienda): 2 unidades = $2.089.980
const YOGA = {
  id: 20, codigo: '20', nombre: 'Lenovo Yoga 920', categoria: 'Notebooks', descripcion: '',
  precio: 1044990, stock: 40, stockCritico: 5, descuento: 0, urls: [],
}
const BOLETA = {
  id: 5,
  idUsuario: 2,
  fecha: '2026-11-20T12:00:00',
  total: 2089980,
  estado: true,
  detalles: [
    { id: 1, idProducto: 20, nombre: 'Lenovo Yoga 920', precioUnitario: 1044990, descuento: 0, precioFinalUnitario: 1044990, cantidad: 2, subtotal: 2089980 },
  ],
}
const YOGA_DESPUES = {
  id: 20, nombre: 'Lenovo Yoga 920', descripcion: '', precio: 1044990, stock: 38, stockCritico: 5,
  descuento: 0, categorias: [{ id: 1, nombre: 'Notebooks' }], imagenes: [],
}

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
})

// Backend simulado: responde según "MÉTODO /ruta"
const RESPUESTAS = {
  'DELETE /carrito': respuesta(204),
  'POST /carrito/items': respuesta(200, {}),
  'POST /boletas/checkout': respuesta(201, BOLETA),
  'GET /categorias': respuesta(200, []),
  'GET /productos?page=0&size=100': respuesta(200, { contenido: [YOGA_DESPUES], pagina: 0, tamanio: 100, totalElementos: 1, totalPaginas: 1 }),
}

async function llenarFormulario(user) {
  await user.type(screen.getByLabelText('Nombre *'), 'Pedro')
  await user.type(screen.getByLabelText('Apellidos *'), 'Hacker')
  await user.type(screen.getByLabelText('Correo *'), 'pedro@gmail.com')
  await user.type(screen.getByLabelText('Calle *'), 'Los Olmos 45')
  await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
  await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
}

describe('Vista Checkout', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async (url, opciones) => {
      const respuestaPedida = RESPUESTAS[`${opciones.method} ${url.replace(API_V1, '')}`]
      if (!respuestaPedida) throw new Error(`Llamada inesperada: ${opciones.method} ${url}`)
      return respuestaPedida
    })
    localStorage.setItem('tf_productos', JSON.stringify([YOGA]))
    addToCart('20', 2)
  })

  it('valida el formulario, alterna la entrega y registra la compra pagada en el backend', async () => {
    const user = userEvent.setup()
    guardarToken('token-cliente')
    render(vista(Checkout, { ruta: '/checkout' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Finalizar compra' })).toBeInTheDocument()
    expect(screen.getByText('Total a pagar: $2.089.980')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')
    expect(screen.getByLabelText('Nombre *')).toHaveClass('is-invalid')

    await user.click(screen.getByRole('radio', { name: 'Retiro en tienda' }))
    expect(screen.queryByLabelText('Calle *')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Despacho a domicilio' }))

    await llenarFormulario(user)
    await user.click(screen.getByRole('button', { name: /Pagar ahora/ }))

    expect(await screen.findByText('Destino: /compra/exitosa/5')).toBeInTheDocument()
    expect(obtenerOrdenes()[0]).toMatchObject({ id: 5, estado: 'Pagada', cliente: { nombre: 'Pedro', correo: 'pedro@gmail.com' } })
    expect(fetch.mock.calls.some(([url]) => url.endsWith('/boletas/checkout'))).toBe(true)
    expect(getCart()).toEqual([])
    expect(obtenerProductoPorCodigo('20').stock).toBe(38)
  })

  it('con pago rechazado va a la pantalla de error, sin boleta y conservando el carrito', async () => {
    const user = userEvent.setup()
    guardarToken('token-cliente')
    render(vista(Checkout, { ruta: '/checkout' }))

    await llenarFormulario(user)
    await user.selectOptions(screen.getByLabelText(/Simulación del pago/), 'rechazado')
    await user.click(screen.getByRole('button', { name: /Pagar ahora/ }))

    expect(await screen.findByText(/Destino: \/compra\/error\//)).toBeInTheDocument()
    expect(obtenerOrdenes()[0]).toMatchObject({ estado: 'Fallida' })
    expect(fetch).not.toHaveBeenCalled()
    expect(getCart()).toEqual([{ codigo: '20', qty: 2 }])
  })

  it('sin sesión muestra que hay que iniciar sesión y no vacía el carrito', async () => {
    const user = userEvent.setup()
    render(vista(Checkout, { ruta: '/checkout' }))

    await llenarFormulario(user)
    await user.click(screen.getByRole('button', { name: /Pagar ahora/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Debes iniciar sesión para pagar.')
    expect(obtenerOrdenes()).toEqual([])
    expect(getCart()).toEqual([{ codigo: '20', qty: 2 }])
  })
})
