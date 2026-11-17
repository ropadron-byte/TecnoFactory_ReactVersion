# TecnoFactory

E-Commerce de venta de PC, accesorios y productos tecnológicos.

Tienda y panel de administración están hechos en **React 19 + Vite + react-router-dom v7**
(`createBrowserRouter`) y con **Bootstrap 5 + react-bootstrap** en todo el sitio (diseño
responsivo en móvil, tablet y escritorio). Las pruebas usan **Vitest** (en lugar de
Jasmine + Karma) junto a React Testing Library.

## Comandos

```bash
npm install
npm run dev            # desarrollo  -> http://localhost:5173
npm run build          # build de producción (dist/) + dist/404.html
npm run preview        # sirve el build
npm run lint           # oxlint
npm test               # todas las pruebas (una vez)
npm run test:watch     # pruebas en modo interactivo
npm run test:coverage  # pruebas + informe de cobertura (coverage/index.html)
```

## Rutas (`src/router.jsx`)

### Tienda (públicas)

| Ruta                            | Vista                                             |
| ------------------------------- | ------------------------------------------------- |
| `/`                             | Home (carrusel, categorías, más vendidos)         |
| `/productos`                    | Catálogo con búsqueda, filtros y orden (en la URL)|
| `/productos/:codigo`            | Detalle de producto                               |
| `/categorias`                   | **Nueva** · Productos separados por categoría     |
| `/categorias/:slug`             | **Nueva** · Una categoría                         |
| `/ofertas`                      | **Nueva** · Productos con descuento               |
| `/carrito`                      | Carrito (Comprar ahora / Limpiar)                 |
| `/checkout`                     | **Nueva** · Datos del cliente, entrega y pago     |
| `/compra/exitosa/:id`           | **Nueva** · Pago correcto + resumen / boleta      |
| `/compra/error/:id`             | **Nueva** · Pago con error + reintentar           |
| `/nosotros`, `/blogs`, `/blogs/:slug`, `/contacto` | Informativas                   |
| `/iniciar-sesion`, `/registro`  | Cuenta (contra la API real)                       |
| `/registro/google`              | **Nueva** · Registro con Google + datos personales |
| `/mi-cuenta`                    | **Nueva** · Perfil editable + vincular Google     |

## Autenticación (API real)

El login, el registro y Google se hacen contra el backend Spring Boot
(`POST /api/auth/login`, `POST /api/usuarios`, `POST /api/auth/google`).
El catálogo, el carrito y las órdenes siguen en `localStorage`.

1. Copia `.env.example` a `.env.local` y ajusta:
   ```bash
   VITE_API_URL=http://localhost:8080
   VITE_GOOGLE_CLIENT_ID=<el mismo GOOGLE_CLIENT_ID del backend>
   ```
2. Levanta el backend (MySQL + API) y luego `npm run dev`.
3. En Google Cloud Console agrega `http://localhost:5173` como
   *Authorized JavaScript origin* del Client ID.

Cualquier correo con formato válido es aceptable: no hay lista de dominios.

Flujos soportados:

- **Contraseña**: `login` → `GET /api/usuarios/me` → sesión con JWT en `tf_sesion`.
- **Google nueva**: `202` → `/registro/google` (correo de Google bloqueado + todos
  los datos personales) → `POST /api/auth/google/completar` → `201` → sesión.
  La cuenta no existe hasta enviar el formulario completo.
- **Google con contraseña**: `409` → iniciar sesión normal → `/mi-cuenta` →
  "Vincular con Google" → `204`.
- **Cuenta solo-Google**: no tiene contraseña; se entra únicamente con Google.
- **Editar perfil**: `/mi-cuenta` (o `/admin/perfil`) → `PUT /api/usuarios/me`.
  El correo queda de solo lectura.

El administrador real es `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env` del backend
(por defecto `ro.padron@duocuc.cl`). Ya no existe el login simulado `admin123`.

### Panel de administración (`/admin/*`)

Protegido por `RequireRole`. Sin sesión o con usuario Cliente → `/iniciar-sesion`.

| Ruta                                                       | Vista                        | Administrador | Vendedor |
| ---------------------------------------------------------- | ---------------------------- | :-----------: | :------: |
| `/admin`                                                   | Dashboard con métricas reales| ✅ | ✅ |
| `/admin/ordenes`, `/admin/ordenes/:id`                     | **Nueva** · Órdenes / Boleta | ✅ | ✅ |
| `/admin/productos`, `/admin/productos/:codigo`             | Productos (lectura)          | ✅ | ✅ |
| `/admin/productos/criticos`                                | **Nueva** · Stock crítico    | ✅ | ✅ |
| `/admin/perfil`                                            | **Nueva** · Mi perfil        | ✅ | ✅ |
| `/admin/productos/nuevo`, `/:codigo/editar`                | Crear / editar producto      | ✅ | ❌ |
| `/admin/productos/reportes`                                | **Nueva** · Reporte inventario | ✅ | ❌ |
| `/admin/categorias`, `/nueva`, `/:id/editar`               | **Nueva** · CRUD categorías  | ✅ | ❌ |
| `/admin/usuarios`, `/nuevo`, `/:id`, `/:id/editar`         | CRUD usuarios                | ✅ | ❌ |
| `/admin/usuarios/:id/compras`                              | **Nueva** · Historial de compras | ✅ | ❌ |
| `/admin/reportes`                                          | **Nueva** · Reportes de ventas | ✅ | ❌ |

Un Vendedor que intenta una ruta de solo Administrador vuelve a `/admin/productos`.
Las rutas con parámetros usan *loaders*: si el registro no existe se muestra un 404.

## Flujo de compra

`Carrito → Checkout → Compra exitosa | Pago con error`

- Si el cliente inició sesión, sus datos se cargan solos (editables).
- Opciones de entrega: despacho a domicilio (pide dirección) o retiro en tienda.
- **No hay pasarela de pago real**: el checkout incluye un selector *"Simulación del pago"*
  (exitoso / rechazado) para poder mostrar ambos resultados en la demo.
- Pago exitoso: se crea la orden, se **descuenta el stock** y se vacía el carrito.
- Pago con error: la orden queda como *Fallida*, el stock y el carrito no cambian, y
  "Volver a realizar el pago" regresa al checkout con los datos ya escritos.
- La boleta se puede imprimir / guardar como PDF (diálogo del navegador) o enviar por
  correo (abre el cliente de correo con la boleta escrita; no hay servidor de correo).
- Cada orden guarda una copia del nombre y precio de cada producto al momento de comprar.

## Datos

La **autenticación** vive en la API (JWT). El **catálogo, carrito y órdenes** siguen en
`localStorage` (fuente de datos simulada con CRUD en `src/services/`):
`tf_productos`, `tf_categorias`, `tf_ordenes`, `tf_usuarios`, `tf_cart`, `tf_sesion`.
Tienda y panel comparten los mismos datos.

- Ofertas: cada producto tiene un `descuento` (%); si es mayor a 0 aparece en **Ofertas**.
- Los catálogos guardados antes de existir las ofertas se migran solos.
- Al renombrar una categoría se actualizan sus productos; no se puede borrar una con productos.
- `tf_usuarios` sigue siendo la lista local que usa el CRUD de usuarios del panel
  (demostración). La sesión real (`tf_sesion`) guarda el JWT y el rol que devuelve la API.

## Pruebas con Vitest

Hay **40 pruebas**, casi siempre **1 por vista**, en `src/test/` (jsdom + React Testing Library,
configurado en `vite.config.js`). Cada archivo se llama como la vista que prueba (`Carrito.test.jsx`,
`Checkout.test.jsx`, `AdminBoleta.test.jsx`, …). `helpers.jsx` y `setup.js` son utilidades compartidas.
Las pruebas de autenticación mockean `fetch` y cubren login, registro (incluido el `409`),
completar perfil de Google (`202` → `201`) y vincular Google (`204`).

> Equivalencias con Jasmine: `describe` / `it` / `expect` / `beforeEach` son iguales;
> `spyOn` pasa a ser `vi.spyOn` y los *mocks* se hacen con `vi.fn()` / `vi.mock()`.

## Estructura

- `src/router.jsx` mapa de rutas, loaders y `createRouter()`.
- `src/pages/` vistas de la tienda · `src/pages/admin/` vistas del panel · `src/pages/blog/` artículos.
- `src/components/` piezas reutilizables (Header, ProductCard, PrecioProducto, CategoriaCard,
  OrdenResumen, BoletaAcciones, AdminLayout, RequireRole, formularios, etc.), hechas con react-bootstrap.
- `src/context/` carrito, sesión y UI del panel.
- `src/services/` acceso a datos: autenticación contra la API (`api.js`, `authService.js`) y CRUD local del catálogo, carrito, órdenes y usuarios.
- `src/utils/` funciones puras: precios, validaciones, reportes, CSV, boleta, texto.
- `src/data/` catálogo y categorías iniciales, regiones/comunas, mapa de `id_comuna` (`comunas.js`), blogs, constantes.
- `src/styles/app.css` único CSS propio: colores de la marca sobre Bootstrap y unos pocos ajustes (el resto son clases y componentes de Bootstrap).

## Despliegue

`npm run build` genera además `dist/404.html` (copia de `index.html`) para que hostings estáticos
como GitHub Pages resuelvan URLs como `/productos` o `/admin/usuarios`. Si publicas en un
subdirectorio (p. ej. `/TecnoFactory/`), define `base: '/TecnoFactory/'` en `vite.config.js`.
