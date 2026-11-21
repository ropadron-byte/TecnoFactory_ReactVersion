import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from './FormField.jsx'
import ImageUrlsField from './ImageUrlsField.jsx'
import { validarProducto } from '../utils/validaciones'
import { imagenesProducto } from '../services/productosService'
import { obtenerCategorias } from '../services/categoriasService'
import EstadoForm from './EstadoForm.jsx'

function valoresIniciales(producto) {
  if (!producto) {
    return { codigo: '', nombre: '', descripcion: '', precio: '', stock: '', stockCritico: '', categoria: '', descuento: '', urls: [''] }
  }
  return {
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion || '',
    precio: String(producto.precio),
    stock: String(producto.stock),
    stockCritico: producto.stockCritico ? String(producto.stockCritico) : '',
    categoria: producto.categoria,
    descuento: producto.descuento ? String(producto.descuento) : '',
    urls: imagenesProducto(producto),
  }
}

/**
 * Formulario de producto para crear (sin `producto`) o editar (con `producto`).
 * `onGuardar(datos)` recibe el producto ya con los tipos correctos.
 */
export default function ProductoForm({ producto, onGuardar, mensajeExito, cancelarA = '/admin/productos' }) {
  const editando = Boolean(producto)
  const [v, setV] = useState(() => valoresIniciales(producto))
  const [enviado, setEnviado] = useState(false)
  const [estado, setEstado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [categorias] = useState(obtenerCategorias)

  const validos = validarProducto(v, { validarCodigo: false })
  const marca = (campo) => (enviado ? (validos[campo] ? 'valid' : 'invalid') : undefined)

  function cambiar(e) {
    const { name, value } = e.target
    setV((prev) => ({ ...prev, [name]: value }))
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviado(true)
    setEstado(null)

    if (!Object.values(validos).every(Boolean)) {
      setEstado({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' })
      return
    }

    // Quitamos espacios, vacíos y duplicados de las URLs.
    const urls = [...new Set(v.urls.map((u) => u.trim()).filter(Boolean))]
    const datos = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim(),
      precio: Number(v.precio),
      stock: Number(v.stock),
      stockCritico: v.stockCritico === '' ? 0 : Number(v.stockCritico),
      categoria: v.categoria,
      descuento: v.descuento === '' ? 0 : Number(v.descuento),
      urls,
    }
    if (editando) datos.codigo = v.codigo

    setGuardando(true)
    try {
      await onGuardar(datos)
      setEstado({ tipo: 'success', texto: mensajeExito })
    } catch (error) {
      setEstado({ tipo: 'error', texto: error.message || 'No se pudo guardar el producto.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="mx-auto" onSubmit={enviar} noValidate style={{ maxWidth: 720 }}>
      {editando && (
        <FormField id="codigo" label="Código producto" hint="Lo asigna el sistema y no se puede modificar.">
          <input type="text" id="codigo" name="codigo" value={v.codigo} readOnly />
        </FormField>
      )}

      <FormField id="nombre" label="Nombre" error="El nombre es obligatorio (máx. 100 caracteres)." estado={marca('nombre')}>
        <input type="text" id="nombre" name="nombre" maxLength={100} value={v.nombre} onChange={cambiar} />
      </FormField>

      <FormField
        id="descripcion"
        label="Descripción"
        hint="Opcional. Máximo 500 caracteres."
        error="La descripción no puede superar los 500 caracteres."
        estado={marca('descripcion')}
      >
        <textarea id="descripcion" name="descripcion" maxLength={500} value={v.descripcion} onChange={cambiar} />
      </FormField>

      <FormField
        id="precio"
        label="Precio"
        hint="En pesos, solo números enteros. Mínimo 0 (se considera producto gratis)."
        error="Ingresa un precio válido (número entero, 0 o más)."
        estado={marca('precio')}
      >
        <input type="number" id="precio" name="precio" min={0} step="1" value={v.precio} onChange={cambiar} />
      </FormField>

      <FormField
        id="stock"
        label="Stock"
        hint="Solo números enteros, mínimo 0."
        error="Ingresa una cantidad de stock válida (número entero, 0 o más)."
        estado={marca('stock')}
      >
        <input type="number" id="stock" name="stock" min={0} step="1" value={v.stock} onChange={cambiar} />
      </FormField>

      <FormField
        id="stockCritico"
        label="Stock crítico"
        hint="Opcional. Se mostrará una alerta cuando el stock llegue a este valor o menos."
        error="El stock crítico debe ser un número entero, 0 o más."
        estado={marca('stockCritico')}
      >
        <input type="number" id="stockCritico" name="stockCritico" min={0} step="1" value={v.stockCritico} onChange={cambiar} />
      </FormField>

      <FormField id="categoria" label="Categoría" error="Selecciona una categoría." estado={marca('categoria')}>
        <select id="categoria" name="categoria" value={v.categoria} onChange={cambiar}>
          <option value="">Selecciona una categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id="descuento"
        label="Descuento (%)"
        hint="Opcional. Entero entre 0 y 100. Con descuento mayor a 0 el producto aparece en Ofertas."
        error="El descuento debe ser un número entero entre 0 y 100."
        estado={marca('descuento')}
      >
        <input type="number" id="descuento" name="descuento" min={0} max={100} step="1" value={v.descuento} onChange={cambiar} />
      </FormField>

      <ImageUrlsField value={v.urls} onChange={(urls) => setV((prev) => ({ ...prev, urls }))} />

      <button type="submit" className="btn btn-warning me-2" disabled={guardando}>
        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar producto'}
      </button>
      {editando && (
        <Link to={cancelarA} className="btn btn-outline-primary">
          Cancelar
        </Link>
      )}
      <EstadoForm estado={estado} />
    </form>
  )
}
