/** Valor de una celda: lo que devuelve SQLite (los BLOB se muestran como texto). */
export type Valor = string | number | null;

/** Mismo formato que `ResultadoSQL` del contrato de la API. */
export interface ResultadoSQL {
  columnas: string[];
  filas: Valor[][];
}

/** Resultado de ejecutar una consulta del estudiante en el navegador. */
export interface ResultadoEjecucion extends ResultadoSQL {
  /** `true` si había más de `LIMITE_FILAS` filas y se cortó la lista. */
  truncado: boolean;
}

export type TipoErrorSql =
  | 'vacio'
  | 'solo_lectura'
  | 'sintaxis'
  | 'referencia'
  | 'agregacion'
  | 'funcion'
  | 'interno';

/** Error ya explicado en español, listo para mostrar. */
export interface ErrorSql {
  tipo: TipoErrorSql;
  titulo: string;
  detalle: string;
  pista?: string;
}

export interface TablaEsquema {
  nombre: string;
  columnas: string[];
}
export type Esquema = TablaEsquema[];

export type Ejecucion =
  | { ok: true; resultado: ResultadoEjecucion }
  | { ok: false; error: ErrorSql };

export type Comparacion = { ok: true } | { ok: false; mensaje: string; detalle: string };
