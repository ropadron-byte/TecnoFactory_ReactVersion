import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPerfil from '../pages/admin/AdminPerfil.jsx'
import { entrarComoAdmin, vista } from './helpers.jsx'
import { obtenerSesion } from '../services/usuariosService'

const respuesta = (datos) => ({
  ok: true,
  status: 200,
  text: () => Promise.resolve(JSON.stringify(datos)),
})

const USUARIO_API = {
  id: 1,
  run: 12345678,
  runDv: '5',
  nombre: 'Ana',
  apellidos: 'Tecno Factory',
  correo: 'ro.padron@duocuc.cl',
  fechaNacimiento: '1990-01-01',
  direccion: 'Casa Matriz Tecno Factory',
  telefono: '+56912345678',
  comuna: 'Santiago',
  tipoUsuario: 'ADMINISTRADOR',
  activo: true,
}

describe('Vista AdminPerfil (sesión con JWT)', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(respuesta(USUARIO_API)))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra los datos de la sesión API y guarda el perfil con PUT /api/v1/usuarios/me', async () => {
    const user = userEvent.setup()
    entrarComoAdmin()
    render(vista(AdminPerfil, { ruta: '/admin/perfil' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveValue('ro.padron@duocuc.cl')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Admin')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Ana')
    await user.type(screen.getByLabelText('Teléfono'), '+56912345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Perfil actualizado correctamente.')
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/usuarios/me')
    expect(opciones.method).toBe('PUT')
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(obtenerSesion().nombre).toBe('Ana')
  })
})
