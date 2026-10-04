import { describe, expect, it } from 'vitest';
import { closest, osa, stripAccents } from './sugerencias';

describe('sugerencias', () => {
  it('stripAccents quita tildes y conserva el resto', () => {
    expect(stripAccents('Categoría Bolívar')).toBe('Categoria Bolivar');
  });

  it('osa cuenta una transposición como un solo cambio', () => {
    expect(osa('FORM', 'FROM')).toBe(1);
    expect(osa('select', 'SELECT')).toBe(0);
    expect(osa('selec', 'SELECT')).toBe(1);
    expect(osa('abc', 'xyz')).toBe(3);
  });

  it('closest devuelve el candidato cercano o null', () => {
    const kw = ['SELECT', 'FROM', 'WHERE'];
    expect(closest('FORM', kw, true)).toBe('FROM');
    expect(closest('WHERRE', kw, true)).toBe('WHERE');
    expect(closest('zzzzzz', kw)).toBeNull();
  });

  it('closest ignora tildes de la palabra y respeta el umbral según el largo', () => {
    expect(closest('categoría', ['categoria', 'precio'])).toBe('categoria');
    // palabra corta (≤ 4): solo se acepta distancia 1
    expect(closest('fro', ['FROM'])).toBe('FROM');
    expect(closest('xx', ['FROM'])).toBeNull();
  });

  it('con strict exige la misma letra inicial', () => {
    expect(closest('ELECT', ['SELECT'], true)).toBeNull();
    expect(closest('ELECT', ['SELECT'])).toBe('SELECT');
  });
});
