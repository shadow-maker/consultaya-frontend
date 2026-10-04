import { beforeAll, describe, expect, it } from 'vitest';
import { ejecutar } from './engine';
import { traducirError } from './errores';
import { crearDatasetPrueba, ESQUEMA_PRUEBA } from '../test/datasetPrueba';

describe('traducirError — mensajes de SQLite (una prueba por fila de la tabla)', () => {
  it('near "X": syntax error → sinónimo de palabra clave', () => {
    const e = traducirError('near "FORM": syntax error', ESQUEMA_PRUEBA, 'SELECT * FORM productos');
    expect(e).toMatchObject({ tipo: 'sintaxis', titulo: 'Error de sintaxis', detalle: 'Hay un error de sintaxis cerca de «FORM».', pista: '¿Quisiste decir FROM?' });
  });

  it('near "FROM" con coma antes → coma de más', () => {
    const e = traducirError('near "FROM": syntax error', ESQUEMA_PRUEBA, 'SELECT nombre, FROM productos');
    expect(e.pista).toBe('Hay una coma de más antes de FROM.');
  });

  it('near "FROM" sin coma ni typo → recordatorio del orden', () => {
    const e = traducirError('near "FROM": syntax error', ESQUEMA_PRUEBA, 'SELECT FROM productos');
    expect(e.pista).toContain('SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT');
  });

  it('near con símbolo → recordatorio del orden', () => {
    const e = traducirError('near ")": syntax error', ESQUEMA_PRUEBA, 'SELECT (1');
    expect(e.detalle).toBe('Hay un error de sintaxis cerca de «)».');
    expect(e.pista).toContain('SELECT … FROM');
  });

  it('incomplete input', () => {
    expect(traducirError('incomplete input')).toMatchObject({
      titulo: 'Error de sintaxis',
      detalle: 'La consulta está incompleta.',
      pista: '¿Falta algo después de un operador, una coma o un paréntesis?',
    });
  });

  it('comilla simple sin cerrar', () => {
    expect(traducirError(`unrecognized token: "'Bebidas"`)).toMatchObject({
      titulo: 'Error de sintaxis',
      detalle: "Falta cerrar una comilla simple (').",
      pista: "Los textos van entre comillas simples: 'Bebidas'.",
    });
  });

  it('comillas dobles sin cerrar y otros símbolos desconocidos', () => {
    expect(traducirError(`unrecognized token: ""Bebidas"`).detalle).toContain('comillas dobles');
    expect(traducirError('unrecognized token: "#"').detalle).toBe('Hay un símbolo que SQL no reconoce: «#».');
  });

  it('no such table: con sugerencia y tablas disponibles', () => {
    const e = traducirError('no such table: producto', ESQUEMA_PRUEBA);
    expect(e).toMatchObject({
      tipo: 'referencia',
      titulo: 'Tabla no encontrada',
      detalle: 'La tabla «producto» no existe en este dataset. ¿Quisiste decir «productos»?',
      pista: 'Tablas disponibles: productos, clientes, ventas.',
    });
  });

  it('no such table: con tilde o ñ avisa que no se usan', () => {
    const e = traducirError('no such table: campañas', [{ nombre: 'campanas', columnas: ['id'] }]);
    expect(e.detalle).toContain('¿Quisiste decir «campanas»?');
    expect(e.pista).toContain('no llevan tildes ni ñ');
  });

  it('no such table: sin sugerencia solo lista las tablas', () => {
    const e = traducirError('no such table: zzzzzzzz', ESQUEMA_PRUEBA);
    expect(e.detalle).toBe('La tabla «zzzzzzzz» no existe en este dataset.');
    expect(e.pista).toBe('Tablas disponibles: productos, clientes, ventas.');
  });

  it('no such column: con sugerencia', () => {
    const e = traducirError('no such column: nombr', ESQUEMA_PRUEBA, 'SELECT nombr FROM productos');
    expect(e).toMatchObject({ titulo: 'Columna no encontrada', detalle: 'La columna «nombr» no existe. ¿Quisiste decir «nombre»?' });
    expect(e.pista).toContain('Columnas disponibles: id, nombre, categoria, precio, stock');
  });

  it('no such column: con tilde → los nombres no llevan tildes', () => {
    const e = traducirError('no such column: categoría', ESQUEMA_PRUEBA, 'SELECT categoría FROM productos');
    expect(e.pista).toBe('Los nombres de columnas no llevan tildes.');
  });

  it('no such column: sin sugerencia → comillas simples para textos', () => {
    const e = traducirError('no such column: Bebidas', ESQUEMA_PRUEBA, 'SELECT * FROM productos WHERE categoria = Bebidas');
    expect(e.detalle).toBe('La columna «Bebidas» no existe.');
    expect(e.pista).toBe("Si querías escribir un texto, ponlo entre comillas simples: 'Bebidas'.");
  });

  it('no such column: alias.col con alias desconocido → lista alias y tablas', () => {
    const sql = 'SELECT x.nombre FROM ventas v JOIN productos p ON v.producto_id = p.id';
    const e = traducirError('no such column: x.nombre', ESQUEMA_PRUEBA, sql);
    expect(e.pista).toContain('«x» no es un alias ni una tabla de esta consulta');
    expect(e.pista).toContain('v (ventas)');
    expect(e.pista).toContain('p (productos)');
  });

  it('no such column: alias.col con alias conocido → columnas de esa tabla', () => {
    const sql = 'SELECT p.nombr FROM ventas v JOIN productos p ON v.producto_id = p.id';
    const e = traducirError('no such column: p.nombr', ESQUEMA_PRUEBA, sql);
    expect(e.detalle).toBe('La columna «p.nombr» no existe. ¿Quisiste decir «p.nombre»?');
    expect(e.pista).toBe('Columnas de productos: id, nombre, categoria, precio, stock.');
  });

  it('ambiguous column name', () => {
    expect(traducirError('ambiguous column name: id')).toMatchObject({
      titulo: 'Columna ambigua',
      detalle: 'La columna «id» existe en más de una tabla.',
      pista: 'Indica la tabla, por ejemplo: p.id',
    });
  });

  it('misuse of aggregate', () => {
    for (const msg of ['misuse of aggregate function COUNT()', 'misuse of aggregate: SUM()']) {
      expect(traducirError(msg)).toMatchObject({
        titulo: 'Agregación mal usada',
        detalle: 'No puedes usar COUNT, SUM, AVG, MIN o MAX dentro de WHERE.',
        pista: 'Para filtrar por un resumen usa HAVING después de GROUP BY.',
      });
    }
  });

  it('aggregate functions are not allowed in the GROUP BY clause', () => {
    expect(traducirError('aggregate functions are not allowed in the GROUP BY clause')).toMatchObject({
      titulo: 'GROUP BY inválido',
      detalle: 'No puedes agrupar por una función de agregación.',
    });
  });

  it('no such function', () => {
    const e = traducirError('no such function: SUMA');
    expect(e).toMatchObject({ titulo: 'Función desconocida', detalle: 'La función «SUMA» no existe. ¿Quisiste decir «SUM»?' });
    expect(e.pista).toBe('Funciones comunes: COUNT, SUM, AVG, MIN, MAX, ROUND, UPPER, LOWER, LENGTH, ABS, COALESCE.');
    expect(traducirError('no such function: ZZZZZZZZ').detalle).toBe('La función «ZZZZZZZZ» no existe.');
  });

  it('wrong number of arguments', () => {
    expect(traducirError('wrong number of arguments to function ROUND()')).toMatchObject({
      titulo: 'Error en función',
      detalle: 'La función ROUND recibió una cantidad incorrecta de argumentos.',
    });
  });

  it('ORDER BY term out of range', () => {
    expect(traducirError('5th ORDER BY term out of range - should be between 1 and 2')).toMatchObject({
      titulo: 'Error en ORDER BY',
      detalle: 'ORDER BY usa una posición de columna que no existe.',
    });
    expect(traducirError('1st ORDER BY term out of range').titulo).toBe('Error en ORDER BY');
  });

  it('HAVING sin GROUP BY', () => {
    expect(traducirError('a GROUP BY clause is required before HAVING')).toMatchObject({
      titulo: 'HAVING sin agrupar',
      detalle: 'Usaste HAVING sin GROUP BY.',
      pista: 'Para filtrar filas individuales usa WHERE.',
    });
  });

  it('HAVING sin GROUP BY (mensaje de sql.js 1.14)', () => {
    expect(traducirError('HAVING clause on a non-aggregate query').titulo).toBe('HAVING sin agrupar');
  });

  it('cualquier otro error muestra el mensaje original', () => {
    expect(traducirError('disk I/O error')).toMatchObject({
      titulo: 'No pudimos ejecutar la consulta',
      detalle: 'disk I/O error',
      pista: 'Revisa la sintaxis de tu consulta.',
    });
  });
});

describe('traducirError con mensajes reales de sql.js', () => {
  let bytes: Uint8Array;
  beforeAll(async () => {
    bytes = await crearDatasetPrueba();
  });
  const traducir = async (sql: string) => {
    const r = await ejecutar(bytes, sql);
    if (r.ok) throw new Error('se esperaba un error para: ' + sql);
    return r.error;
  };

  it('typo de FROM', async () => {
    expect(await traducir('SELECT * FORM productos')).toMatchObject({ titulo: 'Error de sintaxis', pista: '¿Quisiste decir FROM?' });
  });
  it('coma antes de FROM', async () => {
    expect((await traducir('SELECT nombre, FROM productos')).pista).toBe('Hay una coma de más antes de FROM.');
  });
  it('consulta incompleta', async () => {
    expect((await traducir('SELECT * FROM productos WHERE')).detalle).toBe('La consulta está incompleta.');
  });
  it('comilla sin cerrar', async () => {
    expect((await traducir("SELECT * FROM productos WHERE categoria = 'Bebidas")).detalle).toBe("Falta cerrar una comilla simple (').");
  });
  it('tabla inexistente', async () => {
    const e = await traducir('SELECT * FROM producto');
    expect(e.titulo).toBe('Tabla no encontrada');
    expect(e.detalle).toContain('¿Quisiste decir «productos»?');
  });
  it('columna inexistente', async () => {
    const e = await traducir('SELECT nombr FROM productos');
    expect(e.titulo).toBe('Columna no encontrada');
    expect(e.detalle).toContain('¿Quisiste decir «nombre»?');
  });
  it('columna ambigua', async () => {
    expect((await traducir('SELECT id FROM ventas v JOIN productos p ON v.producto_id = p.id')).titulo).toBe('Columna ambigua');
  });
  it('agregación en WHERE', async () => {
    expect((await traducir('SELECT * FROM productos WHERE COUNT(*) > 1')).titulo).toBe('Agregación mal usada');
  });
  it('agregación en GROUP BY', async () => {
    expect((await traducir('SELECT categoria FROM productos GROUP BY COUNT(*)')).titulo).toBe('GROUP BY inválido');
  });
  it('función inexistente', async () => {
    const e = await traducir('SELECT SUMA(precio) FROM productos');
    expect(e.titulo).toBe('Función desconocida');
    expect(e.detalle).toContain('«SUM»');
  });
  it('cantidad incorrecta de argumentos', async () => {
    expect((await traducir('SELECT ROUND() FROM productos')).titulo).toBe('Error en función');
  });
  it('ORDER BY fuera de rango', async () => {
    expect((await traducir('SELECT nombre FROM productos ORDER BY 5')).titulo).toBe('Error en ORDER BY');
  });
  it('HAVING sin GROUP BY', async () => {
    expect((await traducir('SELECT nombre FROM productos HAVING precio > 1')).titulo).toBe('HAVING sin agrupar');
  });
});
