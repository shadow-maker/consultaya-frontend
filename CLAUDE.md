# consultaya-frontend

Parte de ConsultaYa (MVP para aprender SQL). Lee primero los docs de este repo:

- `README.md`: qué es, cómo correrlo (mocks, nativo, Docker), pruebas y deploy.
- `docs/arquitectura.md`: pantallas, sesión, cliente de API, mocks, proxy y motor SQL.
- `docs/api-consumida.md`: endpoints que consume y de qué servicio.
- `docs/testids.md`: `data-testid` acordados con los e2e (no renombrar sin avisar).

Referencia opcional, solo si existe en tu workspace: `../docs/` (especificación original del MVP).

- Rol de este repo: SPA React + Vite + TypeScript; ejecuta el SQL en el navegador con sql.js.
- Contratos de API: los define cada servicio (ver `docs/api-consumida.md`); no cambiar endpoints ni formatos sin acordarlo.
- Puerto local: 5173 · Sin base de datos.
- Reglas: nunca commitear `.env`; Conventional Commits en español, sin líneas Co-Authored-By; scripts de `package.json` y de `scripts/` compatibles con Windows.
