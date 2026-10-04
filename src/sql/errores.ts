import { closest, stripAccents } from './sugerencias';
import { limpiarSql } from './validar';
import type { ErrorSql, Esquema } from './tipos';

const PALABRAS_CLAVE = [
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT',
  'DISTINCT', 'BETWEEN', 'LIKE',
];
const FUNCIONES = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'UPPER', 'LOWER', 'LENGTH', 'ABS', 'COALESCE', 'SUBSTR', 'TRIM'];
const ORDEN = 'Recuerda el orden: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT …';
const NO_ALIAS = new Set([
  'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'OUTER', 'ON', 'GROUP', 'ORDER',
  'HAVING', 'LIMIT', 'UNION', 'USING', 'NATURAL', 'OFFSET',
]);

const sintaxis = (detalle: string, pista?: string): ErrorSql => ({
  tipo: 'sintaxis',
  titulo: 'Error de sintaxis',
  detalle,
  pista,
});

interface Referencias {
  /** Tablas de FROM/JOIN, tal como las escribió el estudiante. */
  tablas: string[];
  /** alias en minúsculas → nombre de tabla escrito. Incluye la tabla consigo misma. */
  alias: Map<string, string>;
}

/** Lee las tablas y alias que aparecen tras FROM / JOIN (análisis liviano, solo para dar pistas). */
function leerReferencias(sql: string): Referencias {
  const limpio = limpiarSql(sql);
  const re = /\b(?:FROM|JOIN)\s+([\p{L}_][\p{L}\p{N}_]*)(?:\s+(?:AS\s+)?([\p{L}_][\p{L}\p{N}_]*))?/giu;
  const tablas: string[] = [];
  const alias = new Map<string, string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(limpio))) {
    const tabla = m[1];
    tablas.push(tabla);
    alias.set(tabla.toLowerCase(), tabla);
    const a = m[2];
    if (a && !NO_ALIAS.has(a.toUpperCase())) alias.set(a.toLowerCase(), tabla);
  }
  return { tablas, alias };
}

const tablaDelEsquema = (esquema: Esquema, nombre: string) =>
  esquema.find((t) => t.nombre.toLowerCase() === nombre.toLowerCase());

const unicos = (xs: string[]) => [...new Set(xs)];

function errorTabla(nombre: string, esquema: Esquema): ErrorSql {
  const limpio = nombre.replace(/^main\./i, '');
  const nombres = esquema.map((t) => t.nombre);
  const s = closest(limpio, nombres);
  let pista = nombres.length ? `Tablas disponibles: ${nombres.join(', ')}.` : undefined;
  if (s && stripAccents(limpio.toLowerCase()) === s.toLowerCase() && limpio.toLowerCase() !== s.toLowerCase()) {
    pista = 'Los nombres de tablas no llevan tildes ni ñ. ' + (pista ?? '');
  }
  return {
    tipo: 'referencia',
    titulo: 'Tabla no encontrada',
    detalle: `La tabla «${limpio}» no existe en este dataset.` + (s ? ` ¿Quisiste decir «${s}»?` : ''),
    pista: pista?.trim(),
  };
}

function errorColumna(nombre: string, esquema: Esquema, sql: string): ErrorSql {
  const titulo = 'Columna no encontrada';
  const refs = leerReferencias(sql);
  const punto = nombre.indexOf('.');

  if (punto > 0) {
    const pre = nombre.slice(0, punto);
    const col = nombre.slice(punto + 1);
    const nombreTabla = refs.alias.get(pre.toLowerCase());
    const tabla = nombreTabla ? tablaDelEsquema(esquema, nombreTabla) : undefined;
    if (!tabla) {
      const disponibles = [...refs.alias.entries()]
        .filter(([a, t]) => a !== t.toLowerCase())
        .map(([a, t]) => `${a} (${t})`);
      const nombresTablas = unicos(refs.tablas.length ? refs.tablas : esquema.map((t) => t.nombre));
      const lista = [...disponibles, ...nombresTablas.filter((t) => !disponibles.some((d) => d.endsWith(`(${t})`)))];
      return {
        tipo: 'referencia',
        titulo,
        detalle: `La columna «${nombre}» no existe.`,
        pista: `«${pre}» no es un alias ni una tabla de esta consulta. Alias y tablas disponibles: ${lista.join(', ')}.`,
      };
    }
    const s = closest(col, tabla.columnas);
    let pista = `Columnas de ${tabla.nombre}: ${tabla.columnas.join(', ')}.`;
    if (s && stripAccents(col.toLowerCase()) === s.toLowerCase()) pista = 'Los nombres de columnas no llevan tildes.';
    return {
      tipo: 'referencia',
      titulo,
      detalle: `La columna «${nombre}» no existe.` + (s ? ` ¿Quisiste decir «${pre}.${s}»?` : ''),
      pista,
    };
  }

  const delaConsulta = refs.tablas
    .map((t) => tablaDelEsquema(esquema, t))
    .filter((t): t is NonNullable<typeof t> => !!t);
  const columnas = unicos((delaConsulta.length ? delaConsulta : esquema).flatMap((t) => t.columnas));
  const s = closest(nombre, columnas);
  let pista: string;
  if (s && stripAccents(nombre.toLowerCase()) === s.toLowerCase()) pista = 'Los nombres de columnas no llevan tildes.';
  else if (s) pista = `Columnas disponibles: ${columnas.join(', ')}.`;
  else pista = `Si querías escribir un texto, ponlo entre comillas simples: '${nombre}'.`;
  return {
    tipo: 'referencia',
    titulo,
    detalle: `La columna «${nombre}» no existe.` + (s ? ` ¿Quisiste decir «${s}»?` : ''),
    pista,
  };
}

function errorSintaxisCerca(cerca: string, sql: string): ErrorSql {
  const detalle = `Hay un error de sintaxis cerca de «${cerca}».`;
  const mayus = cerca.toUpperCase();
  if (mayus === 'FROM' && /,\s*FROM\b/i.test(limpiarSql(sql))) {
    return sintaxis(detalle, 'Hay una coma de más antes de FROM.');
  }
  const esPalabra = /^[\p{L}_][\p{L}\p{N}_]*$/u.test(cerca);
  if (esPalabra && !PALABRAS_CLAVE.includes(mayus)) {
    const s = closest(cerca, PALABRAS_CLAVE, true);
    if (s) return sintaxis(detalle, `¿Quisiste decir ${s}?`);
  }
  return sintaxis(detalle, ORDEN);
}

/**
 * Traduce un mensaje de error de SQLite al español, con sugerencias basadas en el esquema del dataset.
 * `sql` es opcional: permite mejorar algunas pistas (coma antes de FROM, alias desconocidos).
 */
export function traducirError(mensaje: string, esquema: Esquema = [], sql = ''): ErrorSql {
  let m: RegExpExecArray | null;

  if ((m = /near "(.+)": syntax error/s.exec(mensaje))) return errorSintaxisCerca(m[1], sql);

  if (/incomplete input/.test(mensaje)) {
    return sintaxis('La consulta está incompleta.', '¿Falta algo después de un operador, una coma o un paréntesis?');
  }

  if (/unrecognized token: "'/.test(mensaje)) {
    return sintaxis("Falta cerrar una comilla simple (').", "Los textos van entre comillas simples: 'Bebidas'.");
  }
  if (/unrecognized token: ""/.test(mensaje)) {
    return sintaxis('Falta cerrar unas comillas dobles (").', "Para escribir textos usa comillas simples: 'Bebidas'.");
  }
  if ((m = /unrecognized token: "(.+)"/s.exec(mensaje))) {
    return sintaxis(`Hay un símbolo que SQL no reconoce: «${m[1]}».`, 'Revisa si se coló un carácter por error o si copiaste comillas tipográficas.');
  }

  if ((m = /no such table: (.+)/.exec(mensaje))) return errorTabla(m[1].trim(), esquema);

  if ((m = /no such column: (.+)/.exec(mensaje))) return errorColumna(m[1].trim(), esquema, sql);

  if ((m = /ambiguous column name: (.+)/.exec(mensaje))) {
    const col = m[1].trim().replace(/^.*\./, '');
    return {
      tipo: 'referencia',
      titulo: 'Columna ambigua',
      detalle: `La columna «${col}» existe en más de una tabla.`,
      pista: `Indica la tabla, por ejemplo: p.${col}`,
    };
  }

  if (/misuse of aggregate/.test(mensaje)) {
    return {
      tipo: 'agregacion',
      titulo: 'Agregación mal usada',
      detalle: 'No puedes usar COUNT, SUM, AVG, MIN o MAX dentro de WHERE.',
      pista: 'Para filtrar por un resumen usa HAVING después de GROUP BY.',
    };
  }

  if (/aggregate functions are not allowed in the GROUP BY clause/.test(mensaje)) {
    return { tipo: 'agregacion', titulo: 'GROUP BY inválido', detalle: 'No puedes agrupar por una función de agregación.' };
  }

  if ((m = /no such function: (.+)/.exec(mensaje))) {
    const f = m[1].trim();
    const s = closest(f, FUNCIONES);
    return {
      tipo: 'funcion',
      titulo: 'Función desconocida',
      detalle: `La función «${f}» no existe.` + (s ? ` ¿Quisiste decir «${s}»?` : ''),
      pista: 'Funciones comunes: COUNT, SUM, AVG, MIN, MAX, ROUND, UPPER, LOWER, LENGTH, ABS, COALESCE.',
    };
  }

  if ((m = /wrong number of arguments to function (.+)\(\)/.exec(mensaje))) {
    return {
      tipo: 'funcion',
      titulo: 'Error en función',
      detalle: `La función ${m[1].trim()} recibió una cantidad incorrecta de argumentos.`,
    };
  }

  if (/(\d+)(st|nd|rd|th) ORDER BY term out of range/.test(mensaje)) {
    return { tipo: 'sintaxis', titulo: 'Error en ORDER BY', detalle: 'ORDER BY usa una posición de columna que no existe.' };
  }

  // SQLite antiguo: «a GROUP BY clause is required before HAVING»; el de sql.js 1.14: «HAVING clause on a non-aggregate query».
  if (/a GROUP BY clause is required before HAVING|HAVING clause on a non-aggregate query/.test(mensaje)) {
    return {
      tipo: 'agregacion',
      titulo: 'HAVING sin agrupar',
      detalle: 'Usaste HAVING sin GROUP BY.',
      pista: 'Para filtrar filas individuales usa WHERE.',
    };
  }

  return {
    tipo: 'interno',
    titulo: 'No pudimos ejecutar la consulta',
    detalle: mensaje,
    pista: 'Revisa la sintaxis de tu consulta.',
  };
}
