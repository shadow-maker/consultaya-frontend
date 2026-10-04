import { beforeAll, describe, expect, it } from 'vitest';
import { ejecutar, LIMITE_FILAS } from './engine';
import { crearDatasetPrueba } from '../test/datasetPrueba';
import { cargarSqlJs } from './engine';

let bytes: Uint8Array;
beforeAll(async () => {
  bytes = await crearDatasetPrueba();
});

describe('ejecutar (sql.js real)', () => {
  it('devuelve columnas y filas', async () => {
    const r = await ejecutar(bytes, 'SELECT nombre, precio FROM productos WHERE categoria = \'Bebidas\' ORDER BY id');
    expect(r).toEqual({
      ok: true,
      resultado: { columnas: ['nombre', 'precio'], filas: [['Inca Kola 500 ml', 3.5], ['Coca-Cola 1.5 L', 7]], truncado: false },
    });
  });

  it('con 0 filas igual devuelve las columnas', async () => {
    const r = await ejecutar(bytes, "SELECT nombre, precio FROM productos WHERE categoria = 'Inexistente'");
    expect(r).toEqual({ ok: true, resultado: { columnas: ['nombre', 'precio'], filas: [], truncado: false } });
  });

  it('acepta WITH, comentarios y punto y coma final', async () => {
    const r = await ejecutar(bytes, '-- total\nWITH t AS (SELECT precio FROM productos) SELECT COUNT(*) AS n FROM t;');
    expect(r).toEqual({ ok: true, resultado: { columnas: ['n'], filas: [[4]], truncado: false } });
  });

  it('respeta un apóstrofo escapado en los datos', async () => {
    const r = await ejecutar(bytes, "SELECT nombre FROM productos WHERE nombre LIKE 'Papitas%'");
    expect(r.ok && r.resultado.filas).toEqual([["Papitas Lay's"]]);
  });

  it('divide enteros como SQLite (5/2 = 2)', async () => {
    const r = await ejecutar(bytes, 'SELECT 5 / 2 AS a, 5 / 2.0 AS b');
    expect(r.ok && r.resultado.filas).toEqual([[2, 2.5]]);
  });

  it('trunca a 1000 filas y avisa', async () => {
    const r = await ejecutar(bytes, 'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 1500) SELECT x FROM c');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.resultado.filas).toHaveLength(LIMITE_FILAS);
      expect(r.resultado.truncado).toBe(true);
    }
  });

  it('exactamente 1000 filas no se marca como truncado', async () => {
    const r = await ejecutar(bytes, 'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 1000) SELECT x FROM c');
    expect(r.ok && r.resultado.truncado).toBe(false);
  });

  it('bloquea DML antes de llegar a SQLite (HU4-E5)', async () => {
    const r = await ejecutar(bytes, 'DELETE FROM productos');
    expect(r).toMatchObject({ ok: false, error: { tipo: 'solo_lectura', titulo: 'Solo se permiten consultas SELECT' } });
  });

  it('la consulta vacía se rechaza sin ejecutar', async () => {
    expect(await ejecutar(bytes, '-- Escribe tu consulta aquí\n')).toMatchObject({ ok: false, error: { tipo: 'vacio' } });
  });

  it('el error de sintaxis llega traducido (HU4-E4)', async () => {
    const r = await ejecutar(bytes, 'SELECT * FROM');
    expect(r).toMatchObject({ ok: false, error: { titulo: 'Error de sintaxis' } });
  });

  it('el dataset nunca se modifica: cada ejecución usa una copia', async () => {
    // Aunque un SELECT no puede escribir, comprobamos que ejecutar no altera los bytes de origen.
    const copia = bytes.slice();
    await ejecutar(bytes, 'SELECT * FROM productos');
    expect(bytes).toEqual(copia);
  });

  it('acepta ArrayBuffer además de Uint8Array', async () => {
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const r = await ejecutar(buf, 'SELECT COUNT(*) FROM clientes');
    expect(r.ok && r.resultado.filas).toEqual([[2]]);
  });

  it('cargarSqlJs es un singleton', async () => {
    expect(await cargarSqlJs()).toBe(await cargarSqlJs());
  });
});
