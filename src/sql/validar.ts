import { closest } from './sugerencias';
import type { ErrorSql } from './tipos';

const PROHIBIDAS =
  /\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|MERGE|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX)\b/i;

/**
 * Quita comentarios (`-- …`, `/* … *\/`) y vacía el contenido de los literales
 * (`'texto'` → `''`, `"texto"` → `""`) para analizar solo la estructura de la consulta.
 */
export function limpiarSql(sql: string): string {
  const n = sql.length;
  let out = '';
  let i = 0;
  while (i < n) {
    const c = sql[i];
    if (c === '-' && sql[i + 1] === '-') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      const fin = sql.indexOf('*/', i + 2);
      i = fin < 0 ? n : fin + 2;
      out += ' ';
      continue;
    }
    if (c === "'" || c === '"') {
      i++;
      while (i < n) {
        if (sql[i] === c) {
          if (sql[i + 1] === c) {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      out += c + c;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Pre-validaciones previas a SQLite. Devuelve el error a mostrar o `null` si se puede ejecutar. */
export function validarSql(sql: string): ErrorSql | null {
  const limpio = limpiarSql(sql);

  if (limpio.replace(/;/g, '').trim() === '') {
    return {
      tipo: 'vacio',
      titulo: 'Consulta vacía',
      detalle: 'Escribe una consulta antes de ejecutar.',
      pista: 'Por ejemplo: SELECT * FROM productos;',
    };
  }

  const prohibida = PROHIBIDAS.exec(limpio);
  if (prohibida) {
    const palabra = prohibida[1].toUpperCase();
    return {
      tipo: 'solo_lectura',
      titulo: 'Solo se permiten consultas SELECT',
      detalle: `Tu consulta usa ${palabra}, que modifica la base de datos. En este ejercicio solo se permiten consultas SELECT (de lectura).`,
      pista:
        'Los datos de práctica son de solo lectura para que todos los estudiantes trabajen con la misma información.',
    };
  }

  const sentencias = limpio.split(';').filter((s) => s.trim() !== '');
  if (sentencias.length > 1) {
    return {
      tipo: 'sintaxis',
      titulo: 'Error de sintaxis',
      detalle: 'Solo se puede ejecutar una consulta a la vez.',
      pista: 'Deja una sola consulta en el editor o quita los puntos y coma intermedios.',
    };
  }

  const primera = /^\s*([\p{L}_][\p{L}\p{N}_]*)/u.exec(limpio)?.[1] ?? '';
  const mayus = primera.toUpperCase();
  if (mayus !== 'SELECT' && mayus !== 'WITH') {
    const sugerida = primera ? closest(primera, ['SELECT', 'WITH'], true) : null;
    if (sugerida) {
      return {
        tipo: 'sintaxis',
        titulo: 'Error de sintaxis',
        detalle: `No se reconoce «${primera}». ¿Quisiste decir ${sugerida}?`,
        pista: 'Toda consulta de lectura empieza con SELECT: SELECT columnas FROM tabla;',
      };
    }
    return {
      tipo: 'sintaxis',
      titulo: 'Error de sintaxis',
      detalle: 'La consulta debe empezar con SELECT (o WITH).',
      pista: 'Para leer datos escribe, por ejemplo: SELECT * FROM productos;',
    };
  }

  return null;
}
