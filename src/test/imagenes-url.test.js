import { describe, expect, it } from 'vitest'
import { API_URL } from '../services/api'
import { urlImagen } from '../utils/imagenes'

describe('urlImagen', () => {
  it('apunta las rutas relativas del backend al servidor de la API', () => {
    expect(urlImagen('/uploads/blog/portada.jpg')).toBe(`${API_URL}/uploads/blog/portada.jpg`)
    expect(urlImagen('uploads/productos/teclado.png')).toBe(`${API_URL}/uploads/productos/teclado.png`)
  })

  it('no modifica URLs absolutas, de protocolo relativo, data ni blob', () => {
    expect(urlImagen('http://localhost:8080/uploads/blog/a.jpg')).toBe('http://localhost:8080/uploads/blog/a.jpg')
    expect(urlImagen('https://ejemplo.cl/b.jpg')).toBe('https://ejemplo.cl/b.jpg')
    expect(urlImagen('//cdn.ejemplo.cl/c.png')).toBe('//cdn.ejemplo.cl/c.png')
    expect(urlImagen('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(urlImagen('blob:http://localhost:5173/uuid')).toBe('blob:http://localhost:5173/uuid')
  })

  it('devuelve una cadena vacía cuando no hay imagen', () => {
    expect(urlImagen('')).toBe('')
    expect(urlImagen(null)).toBe('')
    expect(urlImagen(undefined)).toBe('')
  })
})
