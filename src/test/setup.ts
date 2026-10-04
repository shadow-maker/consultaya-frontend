import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import { afterEach, beforeAll } from 'vitest';
import { configurarCargadorSqlJs } from '../sql/engine';

const require = createRequire(import.meta.url);

// sql.js en Node/jsdom: el .wasm se lee del disco en lugar de pedirlo por red.
configurarCargadorSqlJs(() =>
  initSqlJs({ wasmBinary: new Uint8Array(readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm'))).buffer }),
);

// El código de la app usa rutas relativas (`/api/...`); fetch de Node necesita una URL absoluta.
beforeAll(() => {
  const fetchOriginal = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/')) input = new URL(input, window.location.origin).href;
    return fetchOriginal(input, init);
  }) as typeof fetch;
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    /* sin localStorage */
  }
});
