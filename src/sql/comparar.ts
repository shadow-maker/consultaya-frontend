import type { Comparacion, ResultadoSQL, Valor } from './tipos';

export const plural = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? '' : 's'}`;

const clave = (fila: Valor[]) => JSON.stringify(fila.map((v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)));
const mismoConjunto = (a: Valor[][], b: Valor[][]) => {
  const x = a.map(clave).sort();
  const y = b.map(clave).sort();
  return x.every((k, i) => k === y[i]);
};

/**
 * Compara el resultado del estudiante con el esperado (portado de `compareResults` del prototipo).
 * Los nombres de columnas no importan, salvo para detectar columnas en otro orden.
 * Con `ordenado`, las filas deben venir en el mismo orden.
 */
export function compararResultados(actual: ResultadoSQL, esperado: ResultadoSQL, ordenado: boolean): Comparacion {
  const a = actual;
  const e = esperado;

  // 1. Cantidad de columnas
  if (a.columnas.length !== e.columnas.length) {
    return {
      ok: false,
      mensaje: `Tu consulta devuelve ${plural(a.columnas.length, 'columna')}, pero se esperaban ${plural(e.columnas.length, 'columna')}.`,
      detalle: 'Revisa qué datos pide el enunciado y muestra solo esas columnas.',
    };
  }

  // 2. Cantidad de filas
  if (a.filas.length !== e.filas.length) {
    return {
      ok: false,
      mensaje: `Tu consulta devuelve ${plural(a.filas.length, 'fila')}, pero se esperaban ${plural(e.filas.length, 'fila')}.`,
      detalle:
        a.filas.length > e.filas.length
          ? 'Tienes filas de más: ¿falta alguna condición en WHERE o HAVING, o un LIMIT?'
          : 'Te faltan filas: revisa si tu condición es demasiado estricta o si filtraste algo que el enunciado no pide.',
    };
  }

  // 3. Igualdad (fila por fila si es ordenado; como multiconjunto si no)
  const igual = (A: Valor[][], B: Valor[][]) =>
    ordenado ? A.every((r, i) => clave(r) === clave(B[i])) : mismoConjunto(A, B);
  if (igual(a.filas, e.filas)) return { ok: true };

  // 4. Mismas columnas por nombre, en otro orden
  const ac = a.columnas.map((c) => c.toLowerCase());
  const ec = e.columnas.map((c) => c.toLowerCase());
  if (new Set(ac).size === ac.length && [...ac].sort().join() === [...ec].sort().join() && ac.join() !== ec.join()) {
    const idx = ec.map((c) => ac.indexOf(c));
    if (igual(a.filas.map((r) => idx.map((i) => r[i])), e.filas)) {
      return {
        ok: false,
        mensaje: 'Los datos son correctos, pero las columnas están en otro orden.',
        detalle: `Escríbelas en el orden que pide el enunciado: ${e.columnas.join(', ')}.`,
      };
    }
  }

  // 5. Mismas filas, otro orden (solo si importa el orden)
  if (ordenado && mismoConjunto(a.filas, e.filas)) {
    return {
      ok: false,
      mensaje: 'Tienes las filas correctas, pero en otro orden.',
      detalle: 'Revisa tu ORDER BY: ¿ordenas por la columna correcta? ¿ASC (de menor a mayor) o DESC (de mayor a menor)?',
    };
  }

  // 6. Primera columna cuyos valores no coinciden
  for (let i = 0; i < e.columnas.length; i++) {
    if (!mismoConjunto(a.filas.map((r) => [r[i]]), e.filas.map((r) => [r[i]]))) {
      return {
        ok: false,
        mensaje: `Los valores de la columna «${a.columnas[i]}» (columna ${i + 1}) no coinciden con los esperados.`,
        detalle: 'Revisa que estés usando la columna o el cálculo correcto, y que tu filtro sea el adecuado.',
      };
    }
  }

  // 7. Valores correctos por columna, pero mal combinados
  return {
    ok: false,
    mensaje: 'Los valores de tu resultado no coinciden con los esperados.',
    detalle:
      'Cada columna tiene los valores correctos por separado, pero no combinados en las mismas filas. Revisa tu JOIN o tu agrupación.',
  };
}
