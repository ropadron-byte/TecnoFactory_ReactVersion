import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// Las páginas se cargan con lazy(); en equipos lentos la primera carga puede tardar más de 1 s.
configure({ asyncUtilTimeout: 15000 })

// jsdom no implementa estas dos funciones del navegador (las usan react-bootstrap y ScrollRestoration)
window.scrollTo = () => {}
window.matchMedia =
  window.matchMedia ||
  (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))

// --- SILENCIAR "Not implemented: navigation to another Document" ---
// Intercepta los clicks en enlaces <a> para prevenir la navegación nativa de JSDOM
window.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' || e.target.closest('a')) {
    e.preventDefault()
  }
})

// Opcional: Mock de window.location para evitar errores con descargas de CSV o asignaciones directas
const originalLocation = window.location
beforeAll(() => {
  delete window.location
  window.location = {
    ...originalLocation,
    assign: vi.fn(),
    replace: vi.fn(),
    href: '',
  }
})

afterAll(() => {
  window.location = originalLocation
})
// -------------------------------------------------------------------

afterEach(() => {
  cleanup()
  localStorage.clear()
})
