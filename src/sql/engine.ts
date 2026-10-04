import type { SqlJsStatic } from 'sql.js';
import { traducirError } from './errores';
import { validarSql } from './validar';
import type { Ejecucion, Esquema, Valor } from './tipos';

/** Máximo de filas que se muestran; si hay más, `truncado` es `true`. */
export const LIMITE_FILAS = 1000;

type Cargador = () => Promise<SqlJsStatic>;

/** Carga normal en el navegador: el `.wasm` lo sirve Vite como asset. */
const cargadorPorDefecto: Cargador = async () => {
  const [{ default: initSqlJs }, { default: wasmUrl }] = await Promise.all([
    import('sql.js'),
    import('sql.js/dist/sql-wasm.wasm?url'),
  ]);
  return initSqlJs({ locateFile: () => wasmUrl });
};

let cargador: Cargador = cargadorPorDefecto;
let instancia: Promise<SqlJsStatic> | null = null;

/** Reemplaza la forma de cargar sql.js (los tests usan `wasmBinary` desde el disco). */
export function configurarCargadorSqlJs(nuevo: Cargador | null): void {
  cargador = nuevo ?? cargadorPorDefecto;
  instancia = null;
}

/** sql.js (WASM) como singleton: se inicializa una sola vez. */
export function cargarSqlJs(): Promise<SqlJsStatic> {
  if (!instancia) {
    instancia = cargador().catch((e) => {
      instancia = null;
      throw e;
    });
  }
  return instancia;
}

type Bytes = ArrayBuffer | Uint8Array;
const aUint8 = (b: Bytes) => (b instanceof Uint8Array ? b : new Uint8Array(b));

function leerEsquema(db: InstanceType<SqlJsStatic['Database']>): Esquema {
  const tablas = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid");
  const nombres = (tablas[0]?.values ?? []).map((r) => String(r[0]));
  return nombres.map((nombre) => {
    const info = db.exec(`PRAGMA table_info("${nombre.replace(/"/g, '""')}")`);
    return { nombre, columnas: (info[0]?.values ?? []).map((r) => String(r[1])) };
  });
}

const aValor = (v: unknown): Valor => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'string') return v;
  if (v instanceof Uint8Array) return `[BLOB de ${v.length} bytes]`;
  return String(v);
};

/**
 * Ejecuta una consulta de solo lectura sobre un archivo SQLite.
 *
 * 1. Pre-validaciones (vacía, DML, varias sentencias, no-SELECT) sin tocar SQLite.
 * 2. Ejecución en una base nueva creada desde `bytes`; siempre se cierra (el dataset nunca se modifica).
 * 3. Los errores de SQLite se traducen al español usando el esquema (el de la base si no se pasa).
 */
export async function ejecutar(bytes: Bytes, sql: string, esquema?: Esquema): Promise<Ejecucion> {
  const previo = validarSql(sql);
  if (previo) return { ok: false, error: previo };

  const SQL = await cargarSqlJs();
  const db = new SQL.Database(aUint8(bytes));
  try {
    const stmt = db.prepare(sql);
    try {
      const columnas = stmt.getColumnNames();
      const filas: Valor[][] = [];
      let truncado = false;
      while (stmt.step()) {
        if (filas.length >= LIMITE_FILAS) {
          truncado = true;
          break;
        }
        filas.push(stmt.get().map(aValor));
      }
      return { ok: true, resultado: { columnas, filas, truncado } };
    } finally {
      stmt.free();
    }
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    let esq = esquema;
    if (!esq) {
      try {
        esq = leerEsquema(db);
      } catch {
        esq = [];
      }
    }
    return { ok: false, error: traducirError(mensaje, esq, sql) };
  } finally {
    db.close();
  }
}
