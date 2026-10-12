import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contacto from '../pages/Contacto.jsx'
import { vista } from './helpers.jsx'

describe('Vista Contacto', () => {
  it('valida los campos, cuenta caracteres y confirma el envío limpiando el formulario', async () => {
    const user = userEvent.setup()
    render(vista(Contacto, { ruta: '/contacto' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Escríbenos' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo antes de enviar el formulario.')

    await user.type(screen.getByLabelText('Correo electrónico'), 'pedro@hotmail.com')
    expect(screen.getByLabelText('Correo electrónico')).toHaveClass('is-invalid')
    await user.clear(screen.getByLabelText('Correo electrónico'))
    await user.type(screen.getByLabelText('Correo electrónico'), 'pedro@gmail.com')
    expect(screen.getByLabelText('Correo electrónico')).toHaveClass('is-valid')

    await user.type(screen.getByLabelText('Nombre *'), 'Pedro')
    await user.type(screen.getByLabelText('Comentario *'), 'Hola')
    expect(screen.getByText('4/500 caracteres.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    expect(screen.getByText('¡Gracias, Pedro! Tu mensaje fue enviado correctamente.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre *')).toHaveValue('')
  })
})
