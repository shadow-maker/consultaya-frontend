import { describe, expect, it } from 'vitest';
import { limpiarSql, validarSql } from './validar';

describe('limpiarSql', () => {
  it('quita comentarios de línea y de bloque', () => {
    expect(limpiarSql('SELECT 1 -- DROP TABLE x\n')).toBe('SELECT 1 \n');
    expect(limpiarSql('SELECT /* DELETE */ 1')).toBe('SELECT   1');
  });

  it('vacía el contenido de los literales', () => {
    expect(limpiarSql("SELECT 'DROP; DELETE' AS x")).toBe("SELECT '' AS x");
    expect(limpiarSql("SELECT 'it''s'")).toBe("SELECT ''");
    expect(limpiarSql('SELECT "drop"')).toBe('SELECT ""');
  });

  it('tolera literales y comentarios sin cerrar', () => {
    expect(limpiarSql("SELECT 'abc")).toBe("SELECT ''");
    expect(limpiarSql('SELECT 1 /* sin cerrar')).toBe('SELECT 1  ');
  });
});

describe('validarSql', () => {
  it('acepta SELECT y WITH', () => {
    expect(validarSql('SELECT * FROM productos')).toBeNull();
    expect(validarSql('  select 1;')).toBeNull();
    expect(validarSql('-- comentario\nSELECT 1')).toBeNull();
    expect(validarSql('WITH t AS (SELECT 1) SELECT * FROM t')).toBeNull();
  });

  it('consulta vacía, solo comentarios o solo puntos y coma', () => {
    for (const sql of ['', '   \n', '-- Escribe tu consulta aquí\n', '/* nada */', ';', '; ;']) {
      expect(validarSql(sql)).toMatchObject({
        tipo: 'vacio',
        titulo: 'Consulta vacía',
        detalle: 'Escribe una consulta antes de ejecutar.',
        pista: 'Por ejemplo: SELECT * FROM productos;',
      });
    }
  });

  it.each(['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'REPLACE', 'GRANT', 'REVOKE', 'MERGE', 'ATTACH', 'DETACH', 'PRAGMA', 'VACUUM', 'REINDEX'])(
    'bloquea %s antes de llegar a SQLite (HU4-E5)',
    (palabra) => {
      const e = validarSql(`${palabra.toLowerCase()} productos`);
      expect(e).toMatchObject({ tipo: 'solo_lectura', titulo: 'Solo se permiten consultas SELECT' });
      expect(e?.detalle).toBe(
        `Tu consulta usa ${palabra}, que modifica la base de datos. En este ejercicio solo se permiten consultas SELECT (de lectura).`,
      );
      expect(e?.pista).toContain('solo lectura');
    },
  );

  it('detecta la palabra prohibida aunque la consulta empiece con SELECT', () => {
    expect(validarSql('SELECT 1; DROP TABLE productos')).toMatchObject({ tipo: 'solo_lectura' });
  });

  it('no se confunde con palabras prohibidas dentro de literales, comentarios o identificadores', () => {
    expect(validarSql("SELECT * FROM productos WHERE nombre = 'DROP TABLE'")).toBeNull();
    expect(validarSql('SELECT 1 -- delete\n')).toBeNull();
    expect(validarSql('SELECT created_at, update_count FROM t')).toBeNull();
  });

  it('rechaza más de una sentencia', () => {
    const e = validarSql('SELECT 1; SELECT 2');
    expect(e).toMatchObject({ tipo: 'sintaxis', detalle: 'Solo se puede ejecutar una consulta a la vez.' });
  });

  it('acepta punto y coma final y punto y coma dentro de un texto', () => {
    expect(validarSql('SELECT 1;')).toBeNull();
    expect(validarSql('SELECT 1;  -- fin')).toBeNull();
    expect(validarSql("SELECT 'a;b'")).toBeNull();
  });

  it('sugiere SELECT si la primera palabra se le parece (HU4-E4)', () => {
    const e = validarSql('SELEC * FROM productos');
    expect(e).toMatchObject({ tipo: 'sintaxis', titulo: 'Error de sintaxis' });
    expect(e?.detalle).toContain('¿Quisiste decir SELECT?');
    expect(validarSql('SLECT * FROM productos')?.detalle).toContain('SELECT');
  });

  it('si no se parece a SELECT, explica que debe empezar con SELECT', () => {
    const e = validarSql('MOSTRAR todo FROM productos');
    expect(e?.detalle).toContain('debe empezar con SELECT');
    expect(validarSql('* FROM productos')?.detalle).toContain('debe empezar con SELECT');
  });
});
