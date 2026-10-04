/** Quita tildes y diacríticos: «categoría» → «categoria». */
export const stripAccents = (s: string): string =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Distancia de edición con transposiciones (Optimal String Alignment), sin distinguir mayúsculas. */
export function osa(a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length;
  const n = b.length;
  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/**
 * Candidato más parecido a `word` para «¿Quisiste decir…?». Devuelve `null` si ninguno
 * está lo bastante cerca (distancia ≤ 1 para palabras de hasta 4 letras, ≤ 2 en las demás).
 * Con `strict`, el candidato debe empezar con la misma letra.
 */
export function closest(word: string, list: readonly string[], strict = false): string | null {
  const w = stripAccents(word);
  let best: string | null = null;
  let bd = Infinity;
  for (const c of list) {
    if (strict && c[0].toLowerCase() !== w[0]?.toLowerCase()) continue;
    const x = osa(w, c);
    if (x < bd) {
      bd = x;
      best = c;
    }
  }
  return bd <= (w.length <= 4 ? 1 : 2) ? best : null;
}
