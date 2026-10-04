import { describe, expect, it } from 'vitest';
import { compararResultados } from './comparar';
import type { ResultadoSQL } from './tipos';

const esperado: ResultadoSQL = {
  columnas: ['nombre', 'precio'],
  filas: [
    ['Aceite', 11.5],
    ['Detergente', 8.9],
    ['Coca-Cola', 7],
  ],
};

describe('compararResultados', () => {
  it('caso 3: resultado idéntico es correcto (y los nombres de columnas no importan)', () => {
    expect(compararResultados(esperado, esperado, true)).toEqual({ ok: true });
    const otroNombre = { columnas: ['n', 'p'], filas: esperado.filas };
    expect(compararResultados(otroNombre, esperado, true)).toEqual({ ok: true });
  });

  it('sin orden: acepta las filas en cualquier orden', () => {
    const invertido = { ...esperado, filas: [...esperado.filas].reverse() };
    expect(compararResultados(invertido, esperado, false)).toEqual({ ok: true });
  });

  it('redondea a 2 decimales al comparar números', () => {
    const casi = { ...esperado, filas: [['Aceite', 11.5000001], ['Detergente', 8.9], ['Coca-Cola', 7.0]] };
    expect(compararResultados(casi, esperado, true)).toEqual({ ok: true });
  });

  it('caso 1: distinta cantidad de columnas (sin revelar nombres)', () => {
    const r = compararResultados({ columnas: ['nombre'], filas: [['a'], ['b'], ['c']] }, esperado, false);
    expect(r).toEqual({
      ok: false,
      mensaje: 'Tu consulta devuelve 1 columna, pero se esperaban 2 columnas.',
      detalle: 'Revisa qué datos pide el enunciado y muestra solo esas columnas.',
    });
  });

  it('caso 2: filas de más', () => {
    const r = compararResultados({ ...esperado, filas: [...esperado.filas, ['Extra', 1]] }, esperado, false);
    expect(r).toMatchObject({
      ok: false,
      mensaje: 'Tu consulta devuelve 4 filas, pero se esperaban 3 filas.',
      detalle: 'Tienes filas de más: ¿falta alguna condición en WHERE o HAVING, o un LIMIT?',
    });
  });

  it('caso 2: filas de menos', () => {
    const r = compararResultados({ ...esperado, filas: esperado.filas.slice(0, 1) }, esperado, false);
    expect(r).toMatchObject({ ok: false, mensaje: 'Tu consulta devuelve 1 fila, pero se esperaban 3 filas.' });
    expect(r.ok === false && r.detalle).toContain('Te faltan filas');
  });

  it('caso 4: columnas correctas en otro orden', () => {
    const r = compararResultados(
      { columnas: ['precio', 'nombre'], filas: esperado.filas.map(([n, p]) => [p, n]) },
      esperado,
      false,
    );
    expect(r).toEqual({
      ok: false,
      mensaje: 'Los datos son correctos, pero las columnas están en otro orden.',
      detalle: 'Escríbelas en el orden que pide el enunciado: nombre, precio.',
    });
  });

  it('caso 5: filas correctas pero en otro orden cuando el orden importa', () => {
    const r = compararResultados({ ...esperado, filas: [...esperado.filas].reverse() }, esperado, true);
    expect(r).toMatchObject({ ok: false, mensaje: 'Tienes las filas correctas, pero en otro orden.' });
    expect(r.ok === false && r.detalle).toContain('ORDER BY');
  });

  it('caso 6: primera columna con valores distintos', () => {
    const r = compararResultados(
      { columnas: ['nombre', 'precio'], filas: [['Otro', 11.5], ['Detergente', 8.9], ['Coca-Cola', 7]] },
      esperado,
      false,
    );
    expect(r).toMatchObject({
      ok: false,
      mensaje: 'Los valores de la columna «nombre» (columna 1) no coinciden con los esperados.',
    });
  });

  it('caso 6: reporta la segunda columna si la primera coincide', () => {
    const r = compararResultados(
      { columnas: ['nombre', 'precio'], filas: [['Aceite', 1], ['Detergente', 8.9], ['Coca-Cola', 7]] },
      esperado,
      false,
    );
    expect(r).toMatchObject({ ok: false, mensaje: 'Los valores de la columna «precio» (columna 2) no coinciden con los esperados.' });
  });

  it('caso 7: columnas correctas por separado pero mal combinadas', () => {
    const r = compararResultados(
      { columnas: ['nombre', 'precio'], filas: [['Aceite', 8.9], ['Detergente', 7], ['Coca-Cola', 11.5]] },
      esperado,
      false,
    );
    expect(r).toMatchObject({ ok: false, mensaje: 'Los valores de tu resultado no coinciden con los esperados.' });
    expect(r.ok === false && r.detalle).toContain('JOIN');
  });

  it('compara NULL y textos sin confundirlos con números', () => {
    const a = { columnas: ['x'], filas: [[null], ['1']] };
    const b = { columnas: ['x'], filas: [[null], [1]] };
    expect(compararResultados(a, b, false)).toMatchObject({ ok: false });
    expect(compararResultados(b, b, false)).toEqual({ ok: true });
  });

  it('dos resultados vacíos con las mismas columnas coinciden', () => {
    const vacio = { columnas: ['a'], filas: [] };
    expect(compararResultados(vacio, vacio, true)).toEqual({ ok: true });
  });
});
