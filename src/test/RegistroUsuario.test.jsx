import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegistroUsuario from '../pages/RegistroUsuario.jsx'
import { vista } from './helpers.jsx'

// Reemplaza el botón real de Google por uno simple que entrega un credential.
vi.mock('../components/BotonGoogle.jsx', () => ({
  default: ({ onCredential }) => (
    <button type="button" onClick={() => onCredential('credential-de-prueba')}>
      Continuar con Google
    </button>
  ),
}))

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : JSON.stringify(datos)),
})

describe('Vista RegistroUsuario', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn((url) => {
      if (url.endsWith('/api/v1/usuarios')) {
        return Promise.resolve(respuesta(201, { id: 2, correo: 'luisa@duocuc.cl' }))
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('valida RUN, contraseñas y campos obligatorios, y registra la cuenta en la API', async () => {
    const user = userEvent.setup()
    render(vista(RegistroUsuario, { ruta: '/registro' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados en rojo.')

    await user.type(screen.getByLabelText('RUN'), '190110228')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByLabelText('RUN')).toHaveClass('is-invalid')
    await user.clear(screen.getByLabelText('RUN'))
    await user.type(screen.getByLabelText('RUN'), '190110222')
    expect(screen.getByLabelText('RUN')).toHaveClass('is-valid')

    expect(screen.getByLabelText('Comuna')).toBeDisabled()
    await user.type(screen.getByLabelText('Nombre'), 'Luisa')
    await user.type(screen.getByLabelText('Apellidos'), 'Soto')
    await user.type(screen.getByLabelText('Correo'), 'luisa@duocuc.cl')
    await user.type(screen.getByLabelText('Contraseña'), 'abcd1234')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'zzzzzzzz')
    await user.type(screen.getByLabelText('Teléfono'), '912345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '2000-01-01' } })
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    expect(screen.getByLabelText('Comuna')).toBeEnabled()
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.type(screen.getByLabelText('Dirección'), 'Los Olmos 45')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveClass('is-invalid')
    expect(fetchMock).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText('Confirmar contraseña'))
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'abcd1234')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Cuenta creada correctamente. Redirigiendo...')).toBeInTheDocument()
    expect(await screen.findByText('Destino: /iniciar-sesion')).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/usuarios')
    expect(opciones.method).toBe('POST')
    expect(JSON.parse(opciones.body)).toMatchObject({
      run: 19011022,
      runDv: '2',
      nombre: 'Luisa',
      apellidos: 'Soto',
      correo: 'luisa@duocuc.cl',
      clave: 'abcd1234',
      fechaNacimiento: '2000-01-01',
      telefono: '912345678',
      direccion: 'Los Olmos 45',
      idComuna: 13101,
    })
  })

  it('muestra el mensaje del backend cuando el correo ya está registrado (409)', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve(respuesta(409, { mensaje: 'El correo ya está registrado' })),
    )
    render(vista(RegistroUsuario, { ruta: '/registro' }))

    await user.type(screen.getByLabelText('RUN'), '190110222')
    await user.type(screen.getByLabelText('Nombre'), 'Luisa')
    await user.type(screen.getByLabelText('Apellidos'), 'Soto')
    await user.type(screen.getByLabelText('Correo'), 'luisa@duocuc.cl')
    await user.type(screen.getByLabelText('Contraseña'), 'abcd1234')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'abcd1234')
    await user.type(screen.getByLabelText('Teléfono'), '912345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '2000-01-01' } })
    await user.selectOptions(screen.getByLabelText('Región'), 'Región Metropolitana')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Santiago')
    await user.type(screen.getByLabelText('Dirección'), 'Los Olmos 45')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado')
  })

  it('ofrece registrarse con Google y redirige a completar los datos', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((url) => {
      if (url.endsWith('/api/v1/auth/google')) {
        return Promise.resolve(
          respuesta(202, {
            requiereCompletarPerfil: true,
            registroToken: 'token-de-registro',
            correo: 'nueva@gmail.com',
            nombre: 'Nueva',
            apellidos: 'Persona',
          }),
        )
      }
      return Promise.resolve(respuesta(404, { mensaje: 'No encontrado' }))
    })

    render(vista(RegistroUsuario, { ruta: '/registro' }))
    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    expect(await screen.findByText('Destino: /registro/google')).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem('tf_google_pendiente'))).toMatchObject({
      registroToken: 'token-de-registro',
      correo: 'nueva@gmail.com',
    })
  })
})
