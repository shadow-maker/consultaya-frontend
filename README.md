# consultaya-frontend

SPA de **ConsultaYa** (aprende SQL practicando, en español): React 19 + Vite + TypeScript (strict). El SQL de los ejercicios se ejecuta en el navegador con sql.js; el backend solo guarda avance y sirve el contenido.

Especificación: `../docs/03-frontend.md` y contratos de API en `../docs/02-contratos-api.md`.

## Requisitos

Node >= 20.

## Desarrollo

```bash
npm install
cp .env.example .env     # opcional
npm run dev              # http://localhost:5173
```

El código llama siempre a rutas relativas `/api/...`; Vite las redirige según `VITE_BACKEND`:

| Variable | Efecto |
|---|---|
| `VITE_BACKEND=native` (por defecto) | `/api/usuarios` → 8001, `/api/lecciones` → 8002, `/api/progreso` → 8003 |
| `VITE_BACKEND=docker` | `/api` → `http://localhost:8080` (nginx de `consultaya-deploy`) |
| `VITE_API_MOCKS=true` | El navegador usa mocks de MSW (sin backend). Solo en `npm run dev` |

Con mocks: `demo@consultaya.pe` / `demo1234` (con avance) y `nuevo@consultaya.pe` / `nuevo1234` (sin avance). El estado de los mocks se guarda en `localStorage` (`consultaya.mock.estado`). El recuadro «Cuentas de prueba» del login solo aparece en desarrollo.

## Pruebas y build

```bash
npm test          # vitest (motor SQL, comparador, mocks y pantallas HU1-HU5)
npm run lint
npm run build     # dist/ (sin MSW ni cuentas de prueba)
```

## Estructura

- `src/sql/`: sql.js, pre-validaciones, errores de SQLite en español, comparador, formato.
- `src/api/`: cliente fetch tipado, funciones por servicio y hooks de TanStack Query.
- `src/auth/`: sesión (token en `localStorage`), `RequireAuth`.
- `src/pages/`, `src/components/`, `src/styles/`: pantallas, piezas de UI y CSS del prototipo.
- `src/mocks/`: handlers MSW y fixtures (5 lecciones, 3 datasets).

## Deploy

```bash
scripts/deploy-s3.sh <bucket> <distribution_id>
```

Ver `../docs/06-despliegue-aws.md`. El `.wasm` de sql.js se sube con `Content-Type: application/wasm`.
