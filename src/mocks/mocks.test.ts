import { describe, expect, it } from 'vitest';
import { cargarSqlJs } from '../sql/engine';
import { ID_ANA } from './estado';

const json = async (r: Response) => ({ status: r.status, cuerpo: await r.json().catch(() => null) });
const post = (ruta: string, cuerpo: unknown, token?: string) =>
  fetch(ruta, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(cuerpo) });
const get = (ruta: string, token?: string) => fetch(ruta, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

async function loginDemo() {
  const { cuerpo } = await json(await post('/api/usuarios/login', { email: 'demo@consultaya.pe', password: 'demo1234' }));
  return cuerpo.token as string;
}

describe('mocks: usuarios', () => {
  it('login correcto devuelve token y usuario', async () => {
    const r = await json(await post('/api/usuarios/login', { email: ' Demo@ConsultaYa.pe', password: 'demo1234' }));
    expect(r.status).toBe(200);
    expect(r.cuerpo.usuario).toEqual({ id: ID_ANA, nombres: 'Ana Torres', email: 'demo@consultaya.pe', plan: 'gratis', creado_en: '2026-08-15T12:00:00Z' });
    expect(r.cuerpo.token.split('.')).toHaveLength(3);
  });

  it('credenciales inválidas → 401 CREDENCIALES_INVALIDAS (HU1-E3)', async () => {
    const r = await json(await post('/api/usuarios/login', { email: 'demo@consultaya.pe', password: 'mala' }));
    expect(r.status).toBe(401);
    expect(r.cuerpo.error).toEqual({ codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Correo o contraseña incorrectos.', campos: null });
  });

  it('login con campos vacíos → 422 con campos', async () => {
    const r = await json(await post('/api/usuarios/login', { email: '', password: '' }));
    expect(r.status).toBe(422);
    expect(r.cuerpo.error.campos).toEqual({ email: 'Ingresa tu correo electrónico.', password: 'Ingresa tu contraseña.' });
  });

  it('registro nuevo → 201; el mismo correo después → 409 CORREO_EN_USO (HU1-E1/E2)', async () => {
    const datos = { nombres: '  Luz   Pérez ', email: 'Luz@Ejemplo.pe ', password: 'secreta123' };
    const ok = await json(await post('/api/usuarios/registro', datos));
    expect(ok.status).toBe(201);
    expect(ok.cuerpo.usuario).toMatchObject({ nombres: 'Luz Pérez', email: 'luz@ejemplo.pe', plan: 'gratis' });
    const dup = await json(await post('/api/usuarios/registro', datos));
    expect(dup.status).toBe(409);
    expect(dup.cuerpo.error.codigo).toBe('CORREO_EN_USO');
    const demo = await json(await post('/api/usuarios/registro', { ...datos, email: 'demo@consultaya.pe' }));
    expect(demo.status).toBe(409);
  });

  it('registro inválido → 422 con campos en español', async () => {
    const r = await json(await post('/api/usuarios/registro', { nombres: ' ', email: 'x', password: '123' }));
    expect(r.status).toBe(422);
    expect(r.cuerpo.error.campos).toEqual({
      nombres: 'Ingresa tus nombres.',
      email: 'Ingresa un correo electrónico válido.',
      password: 'La contraseña debe tener al menos 8 caracteres.',
    });
  });

  it('/me exige token y devuelve el usuario; PATCH cambia los nombres', async () => {
    expect((await json(await get('/api/usuarios/me'))).status).toBe(401);
    const token = await loginDemo();
    expect((await json(await get('/api/usuarios/me', token))).cuerpo.email).toBe('demo@consultaya.pe');
    const p = await fetch('/api/usuarios/me', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ nombres: 'Ana María Torres' }) });
    expect((await json(p)).cuerpo.nombres).toBe('Ana María Torres');
    const vacio = await fetch('/api/usuarios/me', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ nombres: ' ' }) });
    expect(vacio.status).toBe(422);
  });
});

describe('mocks: lecciones', () => {
  it('módulos en orden con lecciones y ejercicios', async () => {
    const { cuerpo } = await json(await get('/api/lecciones/modulos'));
    expect(cuerpo.map((m: { slug: string }) => m.slug)).toEqual(['basico', 'intermedio', 'avanzado']);
    expect(cuerpo[0].lecciones.map((l: { slug: string }) => l.slug)).toEqual(['select-from', 'where', 'order-limit']);
    expect(cuerpo[0].lecciones[1].ejercicios).toEqual([{ id: 'where-1', orden: 1 }, { id: 'where-2', orden: 2 }]);
  });

  it('lección con ejemplos ya calculados y navegación', async () => {
    const { status, cuerpo } = await json(await get('/api/lecciones/lecciones/where'));
    expect(status).toBe(200);
    expect(cuerpo).toMatchObject({ slug: 'where', modulo: { slug: 'basico', nombre: 'Básico' }, anterior: 'select-from', siguiente: 'order-limit' });
    expect(cuerpo.secciones[0].ejemplo.resultado.columnas).toEqual(['nombre', 'distrito']);
    expect(cuerpo.secciones[0].ejemplo.resultado.filas.length).toBe(3);
    expect((await json(await get('/api/lecciones/lecciones/nada'))).cuerpo.error.codigo).toBe('LECCION_NO_EXISTE');
  });

  it('ejercicio con resultado esperado y sin solución', async () => {
    const { cuerpo } = await json(await get('/api/lecciones/ejercicios/where-1'));
    expect(cuerpo).toMatchObject({ id: 'where-1', leccion_slug: 'where', orden: 1, total_en_leccion: 2, dataset: 'bodega', ordenado: false });
    expect(cuerpo.resultado_esperado.filas).toEqual([['Inca Kola 500 ml', 3.5], ['Coca-Cola 1.5 L', 7], ['Agua San Luis 625 ml', 2]]);
    expect(JSON.stringify(cuerpo)).not.toContain('solucion');
    expect((await json(await get('/api/lecciones/ejercicios/where-9'))).cuerpo.error.codigo).toBe('EJERCICIO_NO_EXISTE');
  });

  it('dataset con tablas, muestra de 5 filas y archivo SQLite válido', async () => {
    const { cuerpo } = await json(await get('/api/lecciones/datasets/bodega'));
    expect(cuerpo.archivo_url).toBe('/api/lecciones/datasets/bodega/archivo');
    expect(cuerpo.tablas.map((t: { nombre: string }) => t.nombre)).toEqual(['productos', 'clientes', 'ventas']);
    expect(cuerpo.tablas[0]).toMatchObject({ filas_total: 12 });
    expect(cuerpo.tablas[0].muestra.filas).toHaveLength(5);

    const resp = await get(cuerpo.archivo_url);
    expect(resp.headers.get('Content-Type')).toBe('application/vnd.sqlite3');
    expect(resp.headers.get('ETag')).toBe(`"${cuerpo.archivo_sha256}"`);
    const SQL = await cargarSqlJs();
    const db = new SQL.Database(new Uint8Array(await resp.arrayBuffer()));
    expect(db.exec('SELECT COUNT(*) FROM productos')[0].values[0][0]).toBe(12);
    db.close();

    const cond = await fetch(cuerpo.archivo_url, { headers: { 'If-None-Match': `"${cuerpo.archivo_sha256}"` } });
    expect(cond.status).toBe(304);
    expect((await json(await get('/api/lecciones/datasets/nada'))).cuerpo.error.codigo).toBe('DATASET_NO_EXISTE');
  });
});

describe('mocks: progreso', () => {
  it('exige JWT', async () => {
    expect((await json(await get('/api/progreso/resumen'))).status).toBe(401);
    expect((await json(await get('/api/progreso/ruta'))).status).toBe(401);
  });

  it('resumen de Ana según el seed del contrato', async () => {
    const token = await loginDemo();
    const { cuerpo } = await json(await get('/api/progreso/resumen', token));
    expect(cuerpo).toMatchObject({
      completados: 5, total: 10, porcentaje: 50, lecciones_completadas: 2, lecciones_total: 5, modulos_completados: 0, modulos_total: 3,
      siguiente: { leccion_slug: 'order-limit', ejercicio_id: 'order-limit-2' }, ultimo_completado_en: '2026-09-24T21:03:00Z',
    });
    expect(cuerpo.ejercicios_completados[0]).toEqual({ ejercicio_id: 'order-limit-1', leccion_slug: 'order-limit', completado_en: '2026-09-24T21:03:00Z' });
    expect(cuerpo.modulos[0]).toEqual({ slug: 'basico', completados: 5, total: 6, porcentaje: 83 });
  });

  it('ruta de Ana: estados por lección', async () => {
    const token = await loginDemo();
    const { cuerpo } = await json(await get('/api/progreso/ruta', token));
    expect(cuerpo.modulos[0].lecciones).toEqual([
      { slug: 'select-from', estado: 'completada', completados: 2, total: 2 },
      { slug: 'where', estado: 'completada', completados: 2, total: 2 },
      { slug: 'order-limit', estado: 'en_curso', completados: 1, total: 2 },
    ]);
    expect(cuerpo.modulos[1].lecciones[0].estado).toBe('pendiente');
  });

  it('usuario nuevo: sin avance y siguiente = primera lección sin ejercicio', async () => {
    const reg = await json(await post('/api/usuarios/registro', { nombres: 'Nuevo Uno', email: 'n1@ejemplo.pe', password: 'clave1234' }));
    const { cuerpo } = await json(await get('/api/progreso/resumen', reg.cuerpo.token));
    expect(cuerpo).toMatchObject({ completados: 0, porcentaje: 0, ejercicios_completados: [], ultimo_completado_en: null, siguiente: { leccion_slug: 'select-from', ejercicio_id: null } });
  });

  it('completar: 201 la primera vez, 200 con la fecha original después, 404 si no existe', async () => {
    const reg = await json(await post('/api/usuarios/registro', { nombres: 'Nuevo Dos', email: 'n2@ejemplo.pe', password: 'clave1234' }));
    const token = reg.cuerpo.token as string;
    const a = await json(await post('/api/progreso/ejercicios/where-1/completar', { consulta_sql: 'SELECT 1' }, token));
    expect(a.status).toBe(201);
    expect(a.cuerpo.nuevo).toBe(true);
    const b = await json(await post('/api/progreso/ejercicios/where-1/completar', { consulta_sql: 'SELECT 2' }, token));
    expect(b.status).toBe(200);
    expect(b.cuerpo).toEqual({ ...a.cuerpo, nuevo: false });
    expect((await json(await post('/api/progreso/ejercicios/xx-1/completar', { consulta_sql: 'SELECT 1' }, token))).status).toBe(404);
    const ruta = await json(await get('/api/progreso/ruta', token));
    expect(ruta.cuerpo.modulos[0].lecciones[1]).toEqual({ slug: 'where', estado: 'en_curso', completados: 1, total: 2 });
  });

  it('visita: 204 idempotente y deja la lección en curso; 404 si no existe', async () => {
    const reg = await json(await post('/api/usuarios/registro', { nombres: 'Nuevo Tres', email: 'n3@ejemplo.pe', password: 'clave1234' }));
    const token = reg.cuerpo.token as string;
    expect((await post('/api/progreso/lecciones/join/visita', {}, token)).status).toBe(204);
    expect((await post('/api/progreso/lecciones/join/visita', {}, token)).status).toBe(204);
    expect((await post('/api/progreso/lecciones/nada/visita', {}, token)).status).toBe(404);
    const ruta = await json(await get('/api/progreso/ruta', token));
    expect(ruta.cuerpo.modulos[2].lecciones[0].estado).toBe('en_curso');
  });
});
