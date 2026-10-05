# consultaya-frontend

Frontend de **ConsultaYa**, una plataforma web para aprender SQL practicando, en español, con datos de negocios latinoamericanos. Es una SPA en React 19 + Vite + TypeScript (strict). El SQL de los ejercicios se ejecuta **en el navegador** con sql.js (SQLite compilado a WebAssembly); los servicios solo entregan el contenido y guardan el avance.

## Cómo encaja

| Repo | Rol |
|---|---|
| [consultaya-frontend](https://github.com/shadow-maker/consultaya-frontend) | Esta SPA |
| [consultaya-usuarios](https://github.com/shadow-maker/consultaya-usuarios) | Registro, login, JWT y perfil (puerto 8001) |
| [consultaya-lecciones](https://github.com/shadow-maker/consultaya-lecciones) | Módulos, lecciones, ejercicios y datasets (puerto 8002) |
| [consultaya-progreso](https://github.com/shadow-maker/consultaya-progreso) | Ejercicios completados y estado de la ruta (puerto 8003) |
| [consultaya-deploy](https://github.com/shadow-maker/consultaya-deploy) | Docker Compose, nginx, scripts y pruebas e2e |

El navegador llama siempre a rutas relativas `/api/usuarios/...`, `/api/lecciones/...` y `/api/progreso/...`. En desarrollo las reenvía el proxy de Vite; en Docker y en producción, nginx.

Documentación de este repo:

- [`docs/arquitectura.md`](docs/arquitectura.md): pantallas, sesión, cliente de API, mocks, proxy y motor SQL.
- [`docs/api-consumida.md`](docs/api-consumida.md): endpoints que consume y de qué servicio.
- [`docs/testids.md`](docs/testids.md): `data-testid` que usan los e2e.

## Requisitos

- Node.js 20 o superior (incluye npm).
- No necesitas ningún `.env`: todo funciona con los valores por defecto.

```bash
npm install
```

## Cómo correrlo

Los comandos son iguales en macOS, Linux y Windows (cmd y PowerShell). El servidor de desarrollo usa el puerto **5173** (abre http://localhost:5173).

### 1. Con mocks, sin backend

```bash
npm run dev:mocks
```

MSW simula toda la API en el navegador (5 lecciones, 3 datasets). Cuentas: `demo@consultaya.pe` / `demo1234` (con avance) y `nuevo@consultaya.pe` / `nuevo1234` (sin avance). El estado de los mocks queda en `localStorage` del navegador; para reiniciarlo borra la clave `consultaya.mock.estado` (o los datos del sitio).

### 2. Contra los backends nativos

Levanta los tres servicios (puertos 8001, 8002 y 8003; ver el README de cada repo) y luego:

```bash
npm run dev
```

Vite reenvía `/api/usuarios` → 8001, `/api/lecciones` → 8002 y `/api/progreso` → 8003.

### 3. Contra Docker

Con el stack de `consultaya-deploy` arriba (nginx en el puerto 8080):

```bash
npm run dev:docker
```

Vite reenvía todo `/api` a `http://localhost:8080`.

## Variables `VITE_*`

Se pueden definir en un `.env` local (hay un `.env.example`) o en el entorno. Los scripts `dev:mocks` y `dev:docker` las fijan por ti con `cross-env`, que funciona igual en Windows.

| Variable | Valores | Efecto |
|---|---|---|
| `VITE_BACKEND` | `native` (por defecto) · `docker` | A dónde reenvía el proxy de desarrollo |
| `VITE_API_MOCKS` | `true` · `false` (por defecto) | Activa MSW. Solo tiene efecto en `npm run dev`; el build de producción nunca incluye los mocks |

## Pruebas, lint y build

```bash
npm test          # vitest: motor SQL, comparador, mocks y pantallas (flujos HU1-HU5)
npm run lint      # eslint
npm run build     # tsc + vite build → dist/ (sin MSW ni cuentas de prueba)
npm run preview   # sirve dist/ en el puerto 5173
```

Los tests de pantallas usan los mismos handlers de MSW que `dev:mocks`, así que no necesitan backend.

## Deploy a S3 + CloudFront

Requiere AWS CLI configurada (`aws sts get-caller-identity` debe responder) y Node 20+.

macOS / Linux:

```bash
scripts/deploy-s3.sh <bucket> <distribution_id>
```

Windows (Windows PowerShell 5.1 o PowerShell 7):

```powershell
.\scripts\deploy-s3.ps1 <bucket> <distribution_id>
# ayuda: .\scripts\deploy-s3.ps1 -Help
```

Ambos hacen `npm ci` + `npm run build`, suben `dist/` con caché larga (`immutable`), `index.html` sin caché, fijan `Content-Type: application/wasm` al `.wasm` de sql.js e invalidan `/index.html` y `/` en CloudFront.

## Estructura

```
src/
  api/         cliente fetch tipado, funciones por servicio y hooks de TanStack Query
  auth/        sesión (token en localStorage) y RequireAuth
  components/  Topbar, Editor SQL, tablas de resultados, errores, etc.
  mocks/       handlers MSW y fixtures (solo desarrollo y tests)
  pages/       una pantalla por ruta
  sql/         motor sql.js: validaciones, errores en español, comparador, formato
  styles/      CSS del sistema de diseño
docs/          documentación de este repo
scripts/       deploy a S3 (.sh y .ps1)
```

## Convenciones

- Textos en español peruano, con tuteo.
- Commits en formato Conventional Commits, en español.
- Nunca se commitea un `.env` real.
