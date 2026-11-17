import { useEffect, useRef, useState } from 'react'

const SCRIPT_GSI = 'https://accounts.google.com/gsi/client'

let promesaScript = null

/** Carga el script de Google Identity Services una sola vez. */
function cargarGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (promesaScript) return promesaScript

  promesaScript = new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${SCRIPT_GSI}"]`)
    if (existente) {
      existente.addEventListener('load', () => resolve())
      existente.addEventListener('error', () => reject(new Error('No se pudo cargar Google.')))
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_GSI
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar Google.'))
    document.head.appendChild(script)
  })

  return promesaScript
}

/**
 * Botón oficial de "Continuar con Google".
 * `onCredential(credential)` recibe el ID token que entrega Google.
 */
export default function BotonGoogle({ onCredential, texto = 'continue_with', ancho = 320 }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const contenedor = useRef(null)
  const callback = useRef(onCredential)
  const [error, setError] = useState(() =>
    clientId ? null : 'Falta VITE_GOOGLE_CLIENT_ID en el archivo .env.local del frontend.',
  )

  // Mantener la última función sin volver a inicializar el botón en cada render.
  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    // En las pruebas (jsdom) no se descarga el script real de Google.
    if (import.meta.env.MODE === 'test' || !clientId) return

    let activo = true
    cargarGoogle()
      .then(() => {
        if (!activo || !contenedor.current || !window.google?.accounts?.id) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (respuesta) => callback.current?.(respuesta.credential),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        window.google.accounts.id.renderButton(contenedor.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: texto,
          locale: 'es',
          width: ancho,
        })
      })
      .catch((e) => {
        if (activo) setError(e.message)
      })

    return () => {
      activo = false
    }
  }, [clientId, texto, ancho])

  if (error) {
    return (
      <p className="text-body-secondary small mb-0" role="note">
        {error}
      </p>
    )
  }

  return <div ref={contenedor} className="d-flex justify-content-center" />
}
