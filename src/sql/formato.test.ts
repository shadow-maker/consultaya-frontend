import { describe, expect, it } from 'vitest';
import { esc, fmtDate, fmtDay, fmtVal, hl, initials } from './formato';

describe('fmtVal', () => {
  it('enteros tal cual', () => {
    expect(fmtVal(12)).toBe('12');
    expect(fmtVal(7)).toBe('7');
  });
  it('decimales de hasta 2 cifras con 2 decimales', () => {
    expect(fmtVal(3.5)).toBe('3.50');
    expect(fmtVal(275.4)).toBe('275.40');
    expect(fmtVal(0.3)).toBe('0.30');
  });
  it('más decimales: hasta 4 sin ceros sobrantes', () => {
    expect(fmtVal(1 / 3)).toBe('0.3333');
    expect(fmtVal(2.12345)).toBe('2.1235');
  });
  it('texto y NULL', () => {
    expect(fmtVal('hola')).toBe('hola');
    expect(fmtVal(null)).toBe('NULL');
  });
});

describe('hl (resaltado)', () => {
  it('escapa HTML del texto del usuario', () => {
    const h = hl("SELECT '<script>alert(1)</script>' -- <b>x</b>\n");
    expect(h).not.toContain('<script>');
    expect(h).not.toContain('<b>');
    expect(h).toContain('&lt;script&gt;');
    expect(h).toContain('&lt;b&gt;');
  });
  it('marca palabras clave, funciones, números, textos y comentarios', () => {
    const h = hl("SELECT COUNT(*) FROM t WHERE x = 'a' AND y > 10 -- fin");
    expect(h).toContain('<span class="t-kw">SELECT</span>');
    expect(h).toContain('<span class="t-fn">COUNT</span>');
    expect(h).toContain('<span class="t-num">10</span>');
    expect(h).toContain('<span class="t-str">&#39;a&#39;</span>');
    expect(h).toContain('<span class="t-com">-- fin</span>');
  });
  it('una función sin paréntesis no se marca como función', () => {
    expect(hl('SELECT count FROM t')).not.toContain('t-fn');
  });
  it('conserva el texto original (saltos de línea y espacios)', () => {
    const sql = 'SELECT  a,\n  b\nFROM t;';
    expect(hl(sql).replace(/<[^>]+>/g, '')).toBe(sql);
  });
  it('un texto sin cerrar no rompe el resaltado', () => {
    expect(hl("SELECT 'abc")).toContain('t-str');
  });
});

describe('esc / fechas / iniciales', () => {
  it('esc escapa los cinco caracteres', () => {
    expect(esc(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
    expect(esc(null)).toBe('');
  });
  it('fmtDate usa 24 horas y devuelve vacío si es inválida', () => {
    const f = fmtDate('2026-09-24T21:03:00');
    expect(f).toMatch(/24\/09\/2026/);
    expect(f).toMatch(/21:03/);
    expect(fmtDate('no es fecha')).toBe('');
  });
  it('fmtDay en español', () => {
    expect(fmtDay('2026-08-15')).toMatch(/15 de agosto de 2026/);
    expect(fmtDay('')).toBe('');
  });
  it('initials', () => {
    expect(initials('Ana María Torres')).toBe('AM');
    expect(initials('  diego ')).toBe('D');
  });
});
