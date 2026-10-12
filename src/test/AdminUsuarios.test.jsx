import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminUsuarios from '../pages/admin/AdminUsuarios.jsx'
import { DATOS_USUARIO, entrarComoAdmin, vista } from './helpers.jsx'
import { guardarUsuario, obtenerUsuarios } from '../services/usuariosService'

const confirmOriginal = window.confirm
afterEach(() => {
  window.confirm = confirmOriginal
})

describe('Vista AdminUsuarios', () => {
  it('lista los usuarios, protege la cuenta en sesión y elimina a otro usuario tras confirmar', async () => {
    const user = userEvent.setup()
    guardarUsuario(DATOS_USUARIO)
    entrarComoAdmin()
    render(vista(AdminUsuarios, { ruta: '/admin/usuarios' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument()
    expect(screen.getByText('Admin Tecno Factory')).toBeInTheDocument()
    expect(screen.getByText('admin@duoc.cl')).toBeInTheDocument()
    expect(screen.getByText('Vera Rojas')).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()

    window.confirm = () => true
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    expect(screen.getByRole('alert')).toHaveTextContent('No puedes eliminar tu propia cuenta')
    expect(obtenerUsuarios()).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[1])
    expect(screen.getByRole('alert')).toHaveTextContent('Usuario eliminado.')
    expect(screen.queryByText('Vera Rojas')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ver' }))
    expect(screen.getByText('Destino: /admin/usuarios/1')).toBeInTheDocument()
  })
})
