import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { reiniciarEstado } from '../mocks/estado';
import { servidor } from '../mocks/servidor';
import { configurarCargadorSqlJs } from '../sql/engine';

const require = createRequire(import.meta.url);

// Node ≥ 22 trae un `localStorage` experimental (sin archivo, inutilizable) que tapa al de jsdom.
// Lo reemplazamos por uno en memoria, igual de simple que el del navegador.
class AlmacenEnMemoria implements Storage {
  private datos = new Map<string, string>();
  get length() {
    return this.datos.size;
  }
  clear() {
    this.datos.clear();
  }
  getItem(clave: string) {
    return this.datos.get(clave) ?? null;
  }
  key(i: number) {
    return [...this.datos.keys()][i] ?? null;
  }
  removeItem(clave: string) {
    this.datos.delete(clave);
  }
  setItem(clave: string, valor: string) {
    this.datos.set(clave, String(valor));
  }
}
for (const destino of [globalThis, window]) {
  Object.defineProperty(destino, 'localStorage', { value: new AlmacenEnMemoria(), configurable: true, writable: true });
}

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
  // Los tests de pantallas hablan con los mismos handlers que usa `VITE_API_MOCKS=true`.
  servidor.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  reiniciarEstado();
});

afterAll(() => servidor.close());

afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  try {
    window.localStorage.clear();
  } catch {
    /* sin localStorage */
  }
});
