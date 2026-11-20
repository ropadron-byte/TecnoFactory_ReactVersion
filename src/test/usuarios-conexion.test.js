import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  actualizarUsuario,
  buscarUsuario,
  crearUsuario,
  desactivarUsuario,
  eliminarUsuario,
  listarUsuarios,
} from '../services/usuariosApi'
import { guardarSesion } from '../services/usuariosService'

const respuesta = (status, datos) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(datos === undefined ? '' : JSON.stringify(datos)),
})

const USUARIO_API = {
  id: 2,
  run: 19011022,
  runDv: '2',
  nombre: 'Vera',
  apellidos: 'Rojas',
  correo: 'vera@duocuc.cl',
  fechaNacimiento: '1995-05-05',
  telefono: '+56912345678',
  direccion: 'Av. Siempre Viva 123',
  comuna: 'Santiago',
  tipoUsuario: 'VENDEDOR',
  activo: true,
}

const DATOS_FORMULARIO = {
  run: '190110222',
  nombre: 'Vera',
  apellidos: 'Rojas',
  correo: 'vera@duocuc.cl',
  contrasena: 'clave1234',
  telefono: '+56912345678',
  fecha_nacimiento: '1995-05-05',
  comuna: 'Santiago',
  direccion: 'Av. Siempre Viva 123',
  tipo: 'Vendedor',
}

describe('Conexión de usuarios con la API', () => {
  let fetchMock

  beforeEach(() => {
    guardarSesion({ token: 'jwt-de-prueba' })
    fetchMock = vi.fn(() => Promise.resolve(respuesta(200, USUARIO_API)))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista usuarios paginados y mapea rol, RUN y comuna', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, { contenido: [USUARIO_API], totalElementos: 1 }))

    const usuarios = await listarUsuarios()

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/usuarios?size=1000')
    expect(opciones.headers.Authorization).toBe('Bearer jwt-de-prueba')
    expect(usuarios).toHaveLength(1)
    expect(usuarios[0]).toMatchObject({ id: 2, run: '190110222', tipo: 'Vendedor', comuna: 'Santiago', activo: true })
  })

  it('busca un usuario por id', async () => {
    const usuario = await buscarUsuario(2)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/usuarios/2')
    expect(usuario.nombre).toBe('Vera')
  })

  it('crea vendedores en la ruta de vendedores con la clave', async () => {
    await crearUsuario(DATOS_FORMULARIO)

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/usuarios/vendedores')
    expect(opciones.method).toBe('POST')
    const cuerpo = JSON.parse(opciones.body)
    expect(cuerpo).toMatchObject({ run: 19011022, runDv: '2', idComuna: expect.any(Number), clave: 'clave1234' })
    expect(cuerpo.tipo).toBeUndefined()
  })

  it('crea clientes en la ruta pública', async () => {
    await crearUsuario({ ...DATOS_FORMULARIO, tipo: 'Cliente' })
    expect(fetchMock.mock.calls[0][0]).toContain('/api/usuarios')
    expect(fetchMock.mock.calls[0][0]).not.toContain('/vendedores')
  })

  it('actualiza sin enviar clave cuando el formulario la deja vacía', async () => {
    await actualizarUsuario(2, { ...DATOS_FORMULARIO, contrasena: '', activo: false })

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/usuarios/2')
    expect(opciones.method).toBe('PUT')
    const cuerpo = JSON.parse(opciones.body)
    expect(cuerpo.activo).toBe(false)
    expect(cuerpo.clave).toBeUndefined()
  })

  it('desactiva y elimina un usuario con PATCH y DELETE', async () => {
    await desactivarUsuario(2)
    await eliminarUsuario(2)

    expect(fetchMock.mock.calls[0][0]).toContain('/api/usuarios/2/desactivar')
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH')
    expect(fetchMock.mock.calls[1][0]).toContain('/api/usuarios/2')
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE')
  })
})
