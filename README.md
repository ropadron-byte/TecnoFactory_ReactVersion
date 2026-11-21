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
| `/categorias`                   | Productos separados por categoría                 |
| `/categorias/:slug`             | Una categoría                                     |
| `/ofertas`                      | Productos con descuento                           |
| `/carrito`                      | Carrito (Comprar ahora / Limpiar)                 |
| `/checkout`                     | Datos del cliente, entrega y pago                 |
| `/compra/exitosa/:id`           | Pago correcto + resumen / boleta                  |
| `/compra/error/:id`             | Pago con error + reintentar                       |
| `/nosotros`, `/contacto`        | Informativas                                      |
| `/blogs`                        | Listado de blogs (desde `GET /api/blogs`)         |
| `/blogs/:id`                    | Detalle de un blog (ruta numérica)                |
| `/iniciar-sesion`, `/registro`  | Cuenta (contra la API real)                       |
| `/registro/google`              | Registro con Google + datos personales            |
| `*`                             | Página 404 (`NotFound`)                           |

### Cuenta (requiere sesión)

`/mi-cuenta` está protegido por `RequireRole` (Administrador, Vendedor o Cliente):
perfil editable y vinculación con Google. Sin sesión redirige a `/iniciar-sesion`.

## Autenticación (API real)

El login, el registro, los blogs, las imágenes y el panel de usuarios se hacen contra el
backend Spring Boot, **todos bajo `/api/v1`**: `POST /api/v1/auth/login`,
`POST /api/v1/usuarios`, `POST /api/v1/auth/google`, `/api/v1/blogs`, `/api/v1/imagenes` y
`/api/v1/usuarios`. El catálogo se sincroniza desde `GET /api/v1/categorias` y
`GET /api/v1/productos`; el carrito y las órdenes siguen en `localStorage`.

> **Nota de integración (20 nov):** las rutas de auth, usuarios, blogs e imágenes estaban sin
> versionar (`/api/...`) y el backend las rechazaba con 401 antes de validar credenciales, así
> que el login no funcionaba. Ya están todas corregidas a `/api/v1/...` en los servicios y en
> los tests. Si ves «Se requiere un token válido» al entrar, revisa que `VITE_API_URL` apunte
> al backend y que la ruta no haya quedado sin `/api/v1`. Contexto en la
> [guía 17 del backend](../TecnoFactory/docs/guias/17-integracion-con-react.md).

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
  La cuenta no existe hasta enviar el formulario completo. El registro pendiente se
  guarda en `sessionStorage` (`tf_google_pendiente`).
- **Google con contraseña**: `409` → iniciar sesión normal → `/mi-cuenta` →
  "Vincular con Google" → `204`.
- **Cuenta solo-Google**: no tiene contraseña; se entra únicamente con Google.
- **Editar perfil**: `/mi-cuenta` (o `/admin/perfil`) → `PUT /api/usuarios/me`.
  El correo queda de solo lectura.

El administrador real es `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env` del backend
(por defecto `ro.padron@duocuc.cl`). La UI ya no usa el login simulado `admin123`;
ese usuario sigue existiendo solo en la semilla local (`tf_usuarios`) para demos.

### Panel de administración (`/admin/*`)

Protegido por `RequireRole`. Sin sesión o con usuario Cliente → `/iniciar-sesion`.

| Ruta                                                       | Vista                        | Administrador | Vendedor |
| ---------------------------------------------------------- | ---------------------------- | :-----------: | :------: |
| `/admin`                                                   | Dashboard con métricas calculadas en el cliente | ✅ | ✅ |
| `/admin/ordenes`, `/admin/ordenes/:id`                     | Órdenes / Boleta             | ✅ | ✅ |
| `/admin/perfil`                                            | Mi perfil                    | ✅ | ✅ |
| `/admin/productos`, `/admin/productos/:codigo`             | Productos (lectura)          | ✅ | ✅ |
| `/admin/productos/criticos`                                | Stock crítico                | ✅ | ✅ |
| `/admin/blogs`                                             | Gestión de blogs             | ✅ | ✅ |
| `/admin/blogs/nuevo`                                       | Crear blog                   | ✅ | ✅ |
| `/admin/blogs/:id`                                         | Detalle de gestión de blog   | ✅ | ✅ |
| `/admin/blogs/:id/editar`                                  | Editar blog                  | ✅ | ✅ |
| `/admin/imagenes`                                          | Catálogo de imágenes         | ✅ | ✅ |
| `/admin/productos/nuevo`, `/:codigo/editar`                | Crear / editar producto      | ✅ | ❌ |
| `/admin/productos/reportes`                                | Reporte de inventario        | ✅ | ❌ |
| `/admin/categorias`, `/nueva`, `/:id/editar`               | CRUD categorías              | ✅ | ❌ |
| `/admin/usuarios`, `/nuevo`, `/:id`, `/:id/editar`         | CRUD usuarios (API)          | ✅ | ❌ |
| `/admin/usuarios/:id/compras`                              | Historial de compras         | ✅ | ❌ |
| `/admin/reportes`                                          | Reportes de ventas           | ✅ | ❌ |

Un Vendedor que intenta una ruta de solo Administrador vuelve a `/admin/productos`.
Las rutas con parámetros usan *loaders*: si el registro no existe se muestra un 404.
Las rutas `/admin/*` no reconocidas muestran un 404 propio del panel.

## Blogs e imágenes

- **Blogs públicos**: `/blogs` y `/blogs/:id` leen `GET /api/blogs` y
  `GET /api/blogs/{id}`. No hay blogs sembrados en `localStorage`: la lista viene
  del backend y el contenido se muestra como texto plano.
- **Panel de blogs**: `/admin/blogs` usa las rutas de gestión (`/api/blogs/gestion`)
  para crear, editar, activar/desactivar y borrar; permite subir portada y galería.
- **Panel de imágenes**: `/admin/imagenes` (Admin y Vendedor) lista, sube, reemplaza
  y elimina imágenes del backend, y puede desvincularlas de su dueño. El footer
  `PaymentMethods` no se modificó.
- Las URLs relativas que devuelve el backend (`/uploads/...`) se resuelven contra
  `VITE_API_URL` mediante `urlImagen()` (`src/utils/imagenes.js`), para que las
  imágenes se vean también cuando el frontend corre en `localhost:5173`.

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

| Fuente | Qué contiene |
| --- | --- |
| API (JWT) | Autenticación, usuarios del panel, blogs, imágenes y catálogo inicial |
| `localStorage` | `tf_productos`, `tf_categorias` (caché del catálogo), `tf_ordenes`, `tf_cart`, `tf_sesion`, `tf_usuarios` (semilla demo) |

- Al arrancar, `sincronizarCatalogo()` (`src/main.jsx`) trae categorías y productos
  del backend (`GET /api/v1/...`) y los guarda en `tf_categorias` / `tf_productos`
  con el formato que ya esperan las vistas. Si el backend no responde, se conserva
  la copia local / la semilla inicial.
- Los ABM de productos y categorías del panel siguen escribiendo solo en
  `localStorage`; una sincronización posterior puede sobrescribir esos cambios.
- Las órdenes y el carrito son locales (`tf_ordenes`, `tf_cart`). El dashboard calcula
  ventas e inventario a partir de ahí; los usuarios del dashboard vienen de la API.
- Ofertas: cada producto tiene un `descuento` (%); si es mayor a 0 aparece en **Ofertas**.
- Los catálogos guardados antes de existir las ofertas se migran solos.
- Al renombrar una categoría se actualizan sus productos; no se puede borrar una con productos.
- `tf_token` es la clave que usa el cliente HTTP para todas las rutas `/api/v1`; la sesión
  de la UI guarda el JWT en `tf_sesion`.

## Pruebas con Vitest

Hay **23 archivos de prueba y 84 casos** en `src/test/` (jsdom + React Testing Library,
configurado en `vite.config.js`). Solo hay dos tipos de pruebas:

1. **De componentes**: montan una vista y verifican su interfaz (`Blogs.test.jsx`,
   `AdminBlogs.test.jsx`, `AdminImagenes.test.jsx`, `IniciarSesion.test.jsx`, …).
2. **De conexión con la API**: exercitan el cliente HTTP con `fetch` mockeado
   (`api.test.js`, `api-conexion.test.js`, `catalogoApi.test.js`, `blogs-conexion.test.js`,
   `imagenes-conexion.test.js`, `usuarios-conexion.test.js`, `auth-conexion.test.js`,
   `imagenes-url.test.js`).

No hay pruebas que dependan de datos locales sembrados a mano. `helpers.jsx` y
`setup.js` son utilidades compartidas. Las pruebas de autenticación cubren login,
registro (incluido el `409`), completar perfil de Google (`202` → `201`) y
vincular Google (`204`).

> Equivalencias con Jasmine: `describe` / `it` / `expect` / `beforeEach` son iguales;
> `spyOn` pasa a ser `vi.spyOn` y los *mocks* se hacen con `vi.fn()` / `vi.mock()`.

## Estructura

- `src/router.jsx` mapa de rutas, loaders y `createRouter()`.
- `src/pages/` vistas de la tienda (incluidos `Blogs.jsx` y `DetalleBlog.jsx`) ·
  `src/pages/admin/` vistas del panel, incluidos los ABM de blogs e imágenes.
- `src/components/` piezas reutilizables (Header, ProductCard, PrecioProducto, CategoriaCard,
  OrdenResumen, BoletaAcciones, AdminLayout, RequireRole, BlogForm, BlogGaleria,
  formularios, etc.), hechas con react-bootstrap.
- `src/context/` carrito, sesión y UI del panel.
- `src/services/` acceso a datos: `api.js` (cliente HTTP), `authService.js` (login/Google),
  `usuariosApi.js` ( panel de usuarios), `blogsApi.js` y `imagenesApi.js` (API),
  `catalogoApi.js` (sincronización del catálogo), y `productosService.js`,
  `categoriasService.js`, `carritoService.js`, `ordenesService.js`, `usuariosService.js`
  (CRUD local / sesión demo).
- `src/utils/` funciones puras: precios, validaciones, reportes, CSV, boleta, texto,
  resolución de URLs de imágenes.
- `src/data/` semillas de productos y categorías, regiones/comunas, mapa de
  `id_comuna` (`comunas.js`) y constantes. **No hay blogs sembrados**.
- `src/styles/app.css` CSS propio principal (colores de la marca sobre Bootstrap);
  `src/App.css` y otros archivos `src/styles/`, `src/css/` son ajustes adicionales.

## Despliegue

`npm run build` genera además `dist/404.html` (copia de `index.html`) para que hostings estáticos
como GitHub Pages resuelvan URLs como `/productos` o `/admin/usuarios`. Si publicas en un
subdirectorio (p. ej. `/TecnoFactory/`), define `base: '/TecnoFactory/'` en `vite.config.js`.
