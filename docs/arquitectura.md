# Arquitectura del frontend

SPA en React 19 + Vite + TypeScript estricto. Enrutado con `HashRouter` (las URL son `#/ruta`, así se sirve como sitio estático sin reglas de reescritura). Datos del API con TanStack Query; contenido Markdown con `react-markdown` (sin HTML crudo); SQL con sql.js; tests con vitest, Testing Library y MSW.

## Pantallas y rutas

| Ruta | Pantalla | Sesión | Qué hace |
|---|---|---|---|
| `#/` | Home | no | Landing: cómo funciona, datasets, comparativa, precios. Es estática: no llama al API |
| `#/login` | Login | no (con sesión redirige a `#/dashboard`) | Tras entrar vuelve a la ruta que se quería abrir |
| `#/registro` | Registro | no (con sesión redirige a `#/dashboard`) | Al registrarse lleva a `#/ruta` |
| `#/dashboard` | Panel | sí | Continuar, avance general, avance por módulo, logros, certificados (deshabilitados), modo libre |
| `#/ruta` | Ruta | sí | Módulos con lecciones, estado y botón; buscador lateral |
| `#/ruta/:slug` | Ruta con resumen | sí | Resumen de una lección (lo que aprenderás, ejercicios con fecha) |
| `#/leccion/:slug` | Lección | sí | Explicación en Markdown, ejemplos con resultado, botón «Ir a los ejercicios». Registra la visita |
| `#/ejercicio/:id` | Ejercicio | sí | Ej. `#/ejercicio/where-1`: enunciado, esquema, editor, ejecutar y enviar |
| `#/progreso` | Mi progreso | sí | Vacío («Aún no tienes avance») o con % por módulo y ejercicios con fecha |
| `#/perfil` | Perfil | sí | Editar nombres; membresía Pro deshabilitada («Próximamente») |
| `#/playground` | Modo libre | sí | Vista previa: consola SQL sobre los 3 datasets |
| `*` | No encontrado | — | |

Las rutas con sesión van dentro de `LayoutApp`, que usa `RequireAuth`. Sin sesión se guarda la ruta pedida en el estado de navegación y se manda a `#/login`.

Funciones fuera del MVP se muestran deshabilitadas con la etiqueta «Próximamente»: pista del tutor IA, certificados y plan Pro.

## Sesión y JWT

- El token se guarda en `localStorage` (`consultaya.token`); si el navegador lo bloquea, la sesión dura mientras la pestaña esté abierta.
- El usuario vive en memoria (`AuthProvider`). Su nombre sale de la respuesta de login/registro, de `GET /api/usuarios/me` al recargar y de la respuesta de `PATCH /api/usuarios/me` tras editar el perfil. **El JWT no se decodifica**: su claim `nombres` queda desactualizado después de un PATCH.
- Al abrir la app con un token, `AuthProvider` llama a `/me`: con 401 o 404 borra el token; con un error de red o 5xx lo conserva para reintentar.
- Cualquier respuesta `401` con `codigo: NO_AUTENTICADO` (en cualquier servicio) cierra la sesión: borra token y caché de consultas, muestra «Tu sesión expiró…» y va a `#/login`. Un `401 CREDENCIALES_INVALIDAS` del login no cierra nada.
- Cerrar sesión: toast «Cerraste sesión» y vuelta al inicio.
- Los borradores del editor se guardan en `localStorage` como `consultaya.borrador.<usuario_id>.<ejercicio_id>`; el modo libre usa `consultaya.playground.<usuario_id>.<dataset>`.

## Cliente de API (`src/api/`)

- `cliente.ts`: `api<T>(ruta, opciones)` sobre `fetch`. Rutas siempre relativas (`/api/...`); agrega `Authorization: Bearer` si hay token. Los errores se convierten en `ApiError { status, codigo, mensaje, campos }`, siguiendo el formato `{ "error": { "codigo", "mensaje", "campos" } }`. La app decide por `codigo` y muestra `mensaje`. Un fallo de red es `ApiError` con `codigo: RED`; un 502/503/504 sin cuerpo JSON se traduce a `SERVICIO_NO_DISPONIBLE`.
- `usuarios.ts`, `lecciones.ts`, `progreso.ts`: una función por endpoint, con tipos de `tipos.ts`.
- `hooks.ts`: hooks de TanStack Query y las claves. Todo lo de progreso cuelga de `['progreso']`, que se invalida al completar un ejercicio o visitar una lección. El archivo `.sqlite` de cada dataset se cachea en memoria por `archivo_sha256`.
- Errores de formulario: `422` pinta `campos` bajo cada input; el resto va en un cuadro de error del formulario.

## Mocks (MSW)

Con `npm run dev:mocks` (`VITE_API_MOCKS=true`) el navegador usa un service worker de MSW que implementa los endpoints consumidos (`src/mocks/handlers.ts`). El content vive en `src/mocks/fixtures/`: 5 lecciones (3 módulos), 10 ejercicios y los datasets `bodega`, `delivery` y `campanas` como archivos `.sql`. El `.sqlite` se genera en el navegador ejecutando ese SQL con sql.js, y los resultados de ejemplos y ejercicios se calculan igual que lo haría el seed real.

- El estado (usuarios, avance) se guarda en `localStorage` (`consultaya.mock.estado`).
- Los tests de pantallas usan los mismos handlers con `msw/node` (`src/mocks/servidor.ts`); el estado se reinicia en cada test.
- Los mocks nunca entran al build: `main.tsx` los importa solo con `import.meta.env.DEV` y `VITE_API_MOCKS === 'true'`, y el service worker lo sirve un plugin de Vite solo en desarrollo (no hay archivos de MSW en `public/` ni en `dist/`). Tampoco entra el recuadro de «Cuentas de prueba» del login, que solo se muestra con `import.meta.env.DEV`.

## Proxy de desarrollo

`vite.config.ts`, según `VITE_BACKEND`:

- `native` (por defecto): `/api/usuarios` → `http://localhost:8001`, `/api/lecciones` → 8002, `/api/progreso` → 8003.
- `docker`: `/api` → `http://localhost:8080`.

Vite precalienta las pantallas (`server.warmup`) y declara las dependencias en `optimizeDeps.include` para evitar recargas por re-optimización en el primer arranque.

## Motor SQL (`src/sql/`)

Ejecuta consultas de solo lectura sobre un archivo SQLite descargado, sin tocar el servidor.

### Carga y ejecución

- sql.js se inicializa una sola vez (singleton, `.wasm` servido como asset por Vite).
- Cada ejecución crea `new SQL.Database(bytes)`, ejecuta y cierra: el dataset nunca se modifica.
- `ejecutar(bytes, sql, esquema?)` devuelve `{ ok: true, resultado }` o `{ ok: false, error }`. Las columnas se leen de la sentencia preparada, así que existen aunque haya 0 filas. Se muestran como máximo **1 000 filas** (`truncado: true` si había más).

### Pre-validaciones (antes de SQLite, en este orden)

Primero se quitan comentarios y se vacía el contenido de los literales (`'…'` y `"…"`) para analizar solo la estructura.

1. Vacía (o solo comentarios y `;`) → «Consulta vacía».
2. Palabra prohibida (`DROP DELETE UPDATE INSERT ALTER TRUNCATE CREATE REPLACE GRANT REVOKE MERGE ATTACH DETACH PRAGMA VACUUM REINDEX`) → «Solo se permiten consultas SELECT» (se muestra con estilo de advertencia).
3. Más de una sentencia → «Solo se puede ejecutar una consulta a la vez.»
4. No empieza con `SELECT` o `WITH` → «¿Quisiste decir SELECT?» si se le parece; si no, «La consulta debe empezar con SELECT (o WITH).»

### Traducción de errores (`errores.ts`)

`traducirError(mensaje, esquema, sql)` convierte el mensaje de SQLite en `{ tipo, titulo, detalle, pista }` en español, con sugerencias «¿Quisiste decir…?» (distancia de edición con transposiciones) usando las tablas y columnas del dataset. Casos cubiertos: error de sintaxis (con coma de más antes de FROM o palabra clave mal escrita), consulta incompleta, comilla simple o doble sin cerrar, tabla o columna inexistente (incluye alias desconocido y nombres con tilde), columna ambigua, agregación en WHERE, GROUP BY con agregación, función desconocida, argumentos incorrectos, ORDER BY fuera de rango, HAVING sin GROUP BY (acepta el mensaje de SQLite antiguo y el de sql.js: «HAVING clause on a non-aggregate query») y un caso genérico que muestra el mensaje original.

### Comparador (`comparar.ts`)

`compararResultados(actual, esperado, ordenado)` devuelve `{ ok: true }` o `{ ok: false, mensaje, detalle }`. Cada fila se compara como JSON con los números redondeados a 2 decimales; los nombres de columnas no importan salvo en el caso 4. En orden:

1. Distinta cantidad de columnas (no revela los nombres esperados).
2. Distinta cantidad de filas (indica si sobran o faltan).
3. Igualdad: fila por fila si `ordenado`; como multiconjunto si no → correcto.
4. Mismas columnas por nombre en otro orden.
5. Mismas filas en otro orden (solo si `ordenado`).
6. Primera columna cuyos valores difieren.
7. Valores correctos por columna pero mal combinados (JOIN o agrupación).

### Ejercicio

«Enviar respuesta» está deshabilitado hasta la primera ejecución. Enviar vuelve a ejecutar el texto actual: con error de SQL se muestra el error; si no, se compara con `resultado_esperado`. Si es correcto, se llama a `POST /api/progreso/ejercicios/{id}/completar` con la consulta y se muestra «¡Respuesta correcta!» con el botón de lo siguiente (siguiente ejercicio, siguiente lección o «Ver mi progreso»). Si ese guardado falla, igual se muestra el resultado correcto y se avisa «No pudimos guardar tu avance. Intenta enviar de nuevo.».

### Límites conocidos

- `REPLACE` está en la lista de palabras prohibidas, así que también se bloquea la función `replace(x, y, z)`.
- No hay tiempo máximo de ejecución: una consulta patológica (p. ej. `WITH RECURSIVE` infinito) congela la pestaña. Solo se limita el número de filas mostradas.
- SQLite acepta columnas no agregadas con `GROUP BY` y hace división entera entre enteros (`5/2 = 2`); el comparador detecta los resultados distintos.
- Las comillas dobles pueden tomarse como texto si no existe una columna con ese nombre.

## Pruebas

`npm test` ejecuta vitest en jsdom. `src/test/setup.ts` carga sql.js desde el disco, reemplaza `localStorage` por uno en memoria, resuelve las rutas relativas de `fetch` y levanta el servidor MSW. Hay pruebas unitarias del motor SQL, de los mocks y de las pantallas (login, registro, ruta, lección, ejercicio, progreso, dashboard, perfil y modo libre).
