# API que consume el frontend

El contrato completo (modelos, validaciones, códigos de error) lo documenta cada servicio en su propio repo, en `docs/api.md`. Aquí solo se resume qué usa el frontend; ante una duda, manda el doc del servicio.

| Servicio | Repo | Documentación del contrato |
|---|---|---|
| usuarios | [consultaya-usuarios](https://github.com/shadow-maker/consultaya-usuarios) | [docs/api.md](https://github.com/shadow-maker/consultaya-usuarios/blob/main/docs/api.md) |
| lecciones | [consultaya-lecciones](https://github.com/shadow-maker/consultaya-lecciones) | [docs/api.md](https://github.com/shadow-maker/consultaya-lecciones/blob/main/docs/api.md) |
| progreso | [consultaya-progreso](https://github.com/shadow-maker/consultaya-progreso) | [docs/api.md](https://github.com/shadow-maker/consultaya-progreso/blob/main/docs/api.md) |

Convenciones: JSON en `snake_case`, rutas bajo `/api/<servicio>/...`, autenticación con `Authorization: Bearer <JWT>`, errores con la forma `{ "error": { "codigo", "mensaje", "campos" } }`. Los tipos TypeScript están en `src/api/tipos.ts`.

## usuarios

| Endpoint | Uso en el frontend |
|---|---|
| `POST /api/usuarios/registro` | Pantalla de registro. `409 CORREO_EN_USO` y `422` con `campos` |
| `POST /api/usuarios/login` | Pantalla de login. `401 CREDENCIALES_INVALIDAS` |
| `GET /api/usuarios/me` | Recuperar la sesión al abrir la app (nombre del usuario) |
| `PATCH /api/usuarios/me` | Editar nombres en el perfil; el estado se actualiza con la respuesta |

## lecciones (lectura pública, sin JWT)

| Endpoint | Uso en el frontend |
|---|---|
| `GET /api/lecciones/modulos` | Ruta, dashboard, progreso (títulos y estructura) |
| `GET /api/lecciones/lecciones/{slug}` | Lección, resumen en la ruta, pestañas y navegación del ejercicio |
| `GET /api/lecciones/ejercicios/{id}` | Ejercicio: enunciado, `ordenado` y `resultado_esperado` |
| `GET /api/lecciones/datasets/{slug}` | Esquema (tablas, columnas, muestra de 5 filas) y URL del archivo |
| `GET /api/lecciones/datasets/{slug}/archivo` | Bytes del `.sqlite` que abre sql.js (cacheado por `archivo_sha256`) |

## progreso (requiere JWT)

| Endpoint | Uso en el frontend |
|---|---|
| `POST /api/progreso/lecciones/{slug}/visita` | Al abrir una lección o un ejercicio (idempotente; `204`) |
| `POST /api/progreso/ejercicios/{id}/completar` | Al enviar una respuesta correcta, con `consulta_sql`. `201` primera vez, `200` con `nuevo: false` si ya estaba |
| `GET /api/progreso/ruta` | Estado de cada lección (`pendiente`, `en_curso`, `completada`); se combina con los módulos por `slug` |
| `GET /api/progreso/resumen` | Dashboard y «Mi progreso»: totales, porcentajes, `siguiente` y ejercicios con fecha |

Los porcentajes los calcula el backend; el frontend no los recalcula. Las fechas son ISO 8601 UTC y pueden traer fracción de segundo.

## Pantalla → llamadas

| Pantalla | Llamadas |
|---|---|
| Dashboard | `progreso/resumen`, `lecciones/modulos` |
| Ruta | `lecciones/modulos`, `progreso/ruta`, `progreso/resumen` y, con slug, `lecciones/lecciones/{slug}` |
| Lección | `lecciones/lecciones/{slug}`, `lecciones/datasets/{dataset}`, `progreso/resumen`, `POST progreso/lecciones/{slug}/visita` |
| Ejercicio | `lecciones/ejercicios/{id}`, `lecciones/lecciones/{slug}`, `lecciones/datasets/{dataset}` + archivo, `progreso/resumen`, `lecciones/modulos`, `POST …/visita`, `POST …/completar` |
| Mi progreso | `progreso/resumen`, `lecciones/modulos` |
| Modo libre | `lecciones/datasets/{bodega,delivery,campanas}` + archivo |
| Perfil | `PATCH usuarios/me` |
