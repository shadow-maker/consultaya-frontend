import type { Valor } from './tipos';

/** Escapa HTML para insertar texto de forma segura. */
export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const PALABRAS = new Set(
  'SELECT FROM WHERE AND OR NOT AS ORDER BY ASC DESC LIMIT OFFSET GROUP HAVING JOIN INNER LEFT RIGHT FULL OUTER CROSS ON IN LIKE BETWEEN IS NULL DISTINCT CASE WHEN THEN ELSE END TRUE FALSE UNION WITH'.split(' '),
);
const FUNCIONES = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'UPPER', 'LOWER', 'LENGTH', 'ABS', 'COALESCE', 'SUBSTR', 'TRIM']);

/** Resaltado de sintaxis: devuelve HTML (todo el texto del usuario va escapado). */
export function hl(sql: string): string {
  const re = /(--[^\n]*)|('(?:[^']|'')*'?)|(\d+(?:\.\d+)?)|([\p{L}_][\p{L}\p{N}_]*)|([\s\S])/gu;
  let out = '';
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    const [t, com, str, num, palabra] = m;
    if (com) out += `<span class="t-com">${esc(com)}</span>`;
    else if (str) out += `<span class="t-str">${esc(str)}</span>`;
    else if (num) out += `<span class="t-num">${num}</span>`;
    else if (palabra) {
      const up = palabra.toUpperCase();
      if (PALABRAS.has(up)) out += `<span class="t-kw">${esc(palabra)}</span>`;
      else if (FUNCIONES.has(up) && /^\s*\(/.test(sql.slice(re.lastIndex))) out += `<span class="t-fn">${esc(palabra)}</span>`;
      else out += esc(palabra);
    } else out += esc(t);
  }
  return out;
}

/** Formato de una celda: enteros tal cual, decimales con 2 cifras cuando corresponde (7 → «7», 3.5 → «3.50»). */
export function fmtVal(v: Valor): string {
  if (v === null) return 'NULL';
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v * 100 - Math.round(v * 100)) < 1e-6) return v.toFixed(2);
  return String(parseFloat(v.toFixed(4)));
}

/** «24/09/2026, 21:03» (hora de 24 h, zona del navegador). */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

/** «24 de septiembre de 2026». */
export function fmtDay(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Iniciales para el avatar: «Ana María Torres» → «AM». */
export const initials = (nombre: string): string =>
  nombre.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
