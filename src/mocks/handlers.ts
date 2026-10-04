import { delay, http, HttpResponse } from 'msw';
import type { Usuario } from '../api/tipos';
import { datasetsListos, ejercicioMock, leccionMock, modulosMock } from './contenido';
import { guardarEstado, mock, type UsuarioMock } from './estado';
import { ejercicioInfo, leccionExiste, resumenDe, rutaDe } from './progreso';

/** Retraso artificial de cada respuesta (ms). `iniciarMocks` lo sube para que se note la carga. */
export const config = { retrasoMs: 0 };

// ---------- utilidades ----------
const errorApi = (status: number, codigo: string, mensaje: string, campos: Record<string, string> | null = null) =>
  HttpResponse.json({ error: { codigo, mensaje, campos } }, { status });

const noAutenticado = () => errorApi(401, 'NO_AUTENTICADO', 'Debes iniciar sesión para continuar.');

const base64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deBase64url = (s: string) => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')));

const HORAS_TOKEN = 8;

/** Token con forma de JWT (no es seguro ni se valida la firma: es solo para los mocks). */
function emitirToken(u: UsuarioMock): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload = { sub: u.id, email: u.email, nombres: u.nombres, iat, exp: iat + HORAS_TOKEN * 3600, iss: 'consultaya-usuarios' };
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.mock`;
}

function usuarioDelToken(request: Request): { id: string; existe: UsuarioMock | undefined } | null {
  const cab = request.headers.get('Authorization');
  const m = /^Bearer (.+)$/.exec(cab ?? '');
  if (!m) return null;
  try {
    const payload = deBase64url(m[1].split('.')[1]) as { sub: string; exp: number };
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.sub, existe: mock.estado.usuarios.find((u) => u.id === payload.sub) };
  } catch {
    return null;
  }
}

const publico = (u: UsuarioMock): Usuario => ({ id: u.id, nombres: u.nombres, email: u.email, plan: u.plan, creado_en: u.creado_en });
const ahoraIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function leerJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const j = (await request.json()) as unknown;
    return j && typeof j === 'object' ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const texto = (v: unknown) => (typeof v === 'string' ? v : '');

/** Corre `fn` tras el retraso configurado. */
async function conRetraso<T>(fn: () => T | Promise<T>): Promise<T> {
  if (config.retrasoMs > 0) await delay(config.retrasoMs);
  return fn();
}

// ---------- usuarios ----------
const usuarios = [
  http.post('/api/usuarios/registro', ({ request }) =>
    conRetraso(async () => {
      const cuerpo = await leerJson(request);
      const nombres = texto(cuerpo.nombres).trim().replace(/\s+/g, ' ');
      const email = texto(cuerpo.email).trim().toLowerCase();
      const password = texto(cuerpo.password);
      const campos: Record<string, string> = {};
      if (!nombres) campos.nombres = 'Ingresa tus nombres.';
      else if (nombres.length > 120) campos.nombres = 'Los nombres no pueden superar los 120 caracteres.';
      if (!EMAIL.test(email)) campos.email = 'Ingresa un correo electrónico válido.';
      if (password.length < 8) campos.password = 'La contraseña debe tener al menos 8 caracteres.';
      if (Object.keys(campos).length) return errorApi(422, 'VALIDACION', 'Revisa los datos ingresados.', campos);
      if (mock.estado.usuarios.some((u) => u.email === email)) return errorApi(409, 'CORREO_EN_USO', 'Este correo ya está en uso.');

      const u: UsuarioMock = { id: crypto.randomUUID(), nombres, email, password, plan: 'gratis', creado_en: ahoraIso() };
      mock.estado.usuarios.push(u);
      mock.estado.completados[u.id] = {};
      mock.estado.visitas[u.id] = {};
      guardarEstado();
      return HttpResponse.json({ token: emitirToken(u), usuario: publico(u) }, { status: 201 });
    }),
  ),

  http.post('/api/usuarios/login', ({ request }) =>
    conRetraso(async () => {
      const cuerpo = await leerJson(request);
      const email = texto(cuerpo.email).trim().toLowerCase();
      const password = texto(cuerpo.password);
      const campos: Record<string, string> = {};
      if (!email) campos.email = 'Ingresa tu correo electrónico.';
      if (!password) campos.password = 'Ingresa tu contraseña.';
      if (Object.keys(campos).length) return errorApi(422, 'VALIDACION', 'Revisa los datos ingresados.', campos);
      const u = mock.estado.usuarios.find((x) => x.email === email);
      if (!u || u.password !== password) return errorApi(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
      return HttpResponse.json({ token: emitirToken(u), usuario: publico(u) });
    }),
  ),

  http.get('/api/usuarios/me', ({ request }) =>
    conRetraso(() => {
      const t = usuarioDelToken(request);
      if (!t) return noAutenticado();
      if (!t.existe) return errorApi(404, 'NO_ENCONTRADO', 'No encontramos tu usuario.');
      return HttpResponse.json(publico(t.existe));
    }),
  ),

  http.patch('/api/usuarios/me', ({ request }) =>
    conRetraso(async () => {
      const t = usuarioDelToken(request);
      if (!t) return noAutenticado();
      if (!t.existe) return errorApi(404, 'NO_ENCONTRADO', 'No encontramos tu usuario.');
      const nombres = texto((await leerJson(request)).nombres).trim().replace(/\s+/g, ' ');
      if (!nombres) return errorApi(422, 'VALIDACION', 'Revisa los datos ingresados.', { nombres: 'Ingresa tus nombres.' });
      if (nombres.length > 120) {
        return errorApi(422, 'VALIDACION', 'Revisa los datos ingresados.', { nombres: 'Los nombres no pueden superar los 120 caracteres.' });
      }
      t.existe.nombres = nombres;
      guardarEstado();
      return HttpResponse.json(publico(t.existe));
    }),
  ),
];

// ---------- lecciones (lectura pública) ----------
const lecciones = [
  http.get('/api/lecciones/modulos', () => conRetraso(() => HttpResponse.json(modulosMock()))),

  http.get('/api/lecciones/lecciones/:slug', ({ params }) =>
    conRetraso(async () => {
      const l = await leccionMock(String(params.slug));
      return l ? HttpResponse.json(l) : errorApi(404, 'LECCION_NO_EXISTE', 'La lección no existe.');
    }),
  ),

  http.get('/api/lecciones/ejercicios/:id', ({ params }) =>
    conRetraso(async () => {
      const e = await ejercicioMock(String(params.id));
      return e ? HttpResponse.json(e) : errorApi(404, 'EJERCICIO_NO_EXISTE', 'El ejercicio no existe.');
    }),
  ),

  http.get('/api/lecciones/datasets/:slug/archivo', ({ params, request }) =>
    conRetraso(async () => {
      const ds = (await datasetsListos()).get(String(params.slug));
      if (!ds) return errorApi(404, 'DATASET_NO_EXISTE', 'El dataset no existe.');
      const etag = `"${ds.detalle.archivo_sha256}"`;
      const cabeceras = { ETag: etag, 'Cache-Control': 'public, max-age=3600' };
      if (request.headers.get('If-None-Match') === etag) return new HttpResponse(null, { status: 304, headers: cabeceras });
      return new HttpResponse(ds.bytes as BufferSource, { headers: { ...cabeceras, 'Content-Type': 'application/vnd.sqlite3' } });
    }),
  ),

  http.get('/api/lecciones/datasets/:slug', ({ params }) =>
    conRetraso(async () => {
      const ds = (await datasetsListos()).get(String(params.slug));
      return ds ? HttpResponse.json(ds.detalle) : errorApi(404, 'DATASET_NO_EXISTE', 'El dataset no existe.');
    }),
  ),
];

// ---------- progreso (JWT obligatorio) ----------
const progreso = [
  http.post('/api/progreso/lecciones/:slug/visita', ({ params, request }) =>
    conRetraso(() => {
      const t = usuarioDelToken(request);
      if (!t) return noAutenticado();
      const slug = String(params.slug);
      if (!leccionExiste(slug)) return errorApi(404, 'LECCION_NO_EXISTE', 'La lección no existe.');
      const visitas = (mock.estado.visitas[t.id] ??= {});
      visitas[slug] ??= ahoraIso();
      guardarEstado();
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  http.post('/api/progreso/ejercicios/:id/completar', ({ params, request }) =>
    conRetraso(async () => {
      const t = usuarioDelToken(request);
      if (!t) return noAutenticado();
      const id = String(params.id);
      const info = ejercicioInfo(id);
      if (!info) return errorApi(404, 'EJERCICIO_NO_EXISTE', 'El ejercicio no existe.');
      const consulta = texto((await leerJson(request)).consulta_sql);
      if (!consulta || consulta.length > 10000) {
        return errorApi(422, 'VALIDACION', 'Revisa los datos ingresados.', { consulta_sql: 'La consulta debe tener entre 1 y 10 000 caracteres.' });
      }
      const hechos = (mock.estado.completados[t.id] ??= {});
      const previo = hechos[id];
      if (previo) return HttpResponse.json({ ejercicio_id: id, completado_en: previo.completado_en, nuevo: false });
      const completado_en = ahoraIso();
      hechos[id] = { leccion_slug: info.leccion_slug, completado_en, consulta_sql: consulta };
      (mock.estado.visitas[t.id] ??= {})[info.leccion_slug] ??= completado_en;
      guardarEstado();
      return HttpResponse.json({ ejercicio_id: id, completado_en, nuevo: true }, { status: 201 });
    }),
  ),

  http.get('/api/progreso/ruta', ({ request }) =>
    conRetraso(() => {
      const t = usuarioDelToken(request);
      return t ? HttpResponse.json(rutaDe(t.id)) : noAutenticado();
    }),
  ),

  http.get('/api/progreso/resumen', ({ request }) =>
    conRetraso(() => {
      const t = usuarioDelToken(request);
      return t ? HttpResponse.json(resumenDe(t.id)) : noAutenticado();
    }),
  ),
];

export const handlers = [...usuarios, ...lecciones, ...progreso];
