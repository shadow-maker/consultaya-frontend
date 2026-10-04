import type { Dataset, DatasetTabla, Ejercicio, Leccion, Modulo, ResultadoSQL, Seccion } from '../api/tipos';
import { cargarSqlJs, ejecutar } from '../sql/engine';
import { DATASETS_FIXTURE } from './fixtures/datasets';
import { LECCIONES_FIXTURE, MODULOS_FIXTURE } from './fixtures/contenido';

/** Estructura de la ruta (sin SQL): la usan los endpoints de progreso. */
export const ESTRUCTURA = MODULOS_FIXTURE.map((m) => ({
  ...m,
  lecciones: LECCIONES_FIXTURE.filter((l) => l.modulo === m.slug).map((l) => ({
    slug: l.slug,
    ejercicios: l.ejercicios.map((_, i) => `${l.slug}-${i + 1}`),
  })),
}));

export const LECCIONES_EN_ORDEN = LECCIONES_FIXTURE.map((l, i) => ({ ...l, orden: i + 1 }));

interface DatasetListo {
  detalle: Dataset;
  bytes: Uint8Array;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

let datasets: Promise<Map<string, DatasetListo>> | null = null;

/** Construye los .sqlite ejecutando los .sql de fixture (igual que el seed real) y calcula tablas/muestras. */
export function datasetsListos(): Promise<Map<string, DatasetListo>> {
  datasets ??= (async () => {
    const SQL = await cargarSqlJs();
    const mapa = new Map<string, DatasetListo>();
    for (const f of DATASETS_FIXTURE) {
      const db = new SQL.Database();
      db.run(f.sql);
      const tablas: DatasetTabla[] = f.tablas.map((t) => {
        const muestra = db.exec(`SELECT * FROM ${t.nombre} LIMIT 5`)[0];
        const total = Number(db.exec(`SELECT COUNT(*) FROM ${t.nombre}`)[0].values[0][0]);
        return {
          nombre: t.nombre,
          descripcion: t.descripcion,
          filas_total: total,
          columnas: t.columnas,
          muestra: { columnas: muestra.columns, filas: muestra.values as ResultadoSQL['filas'] },
        };
      });
      const bytes = db.export();
      db.close();
      const hash = await sha256(bytes);
      mapa.set(f.slug, {
        bytes,
        detalle: {
          slug: f.slug,
          nombre: f.nombre,
          lugar: f.lugar,
          descripcion: f.descripcion,
          icono: f.icono,
          archivo_url: `/api/lecciones/datasets/${f.slug}/archivo`,
          archivo_sha256: hash,
          tablas,
        },
      });
    }
    return mapa;
  })();
  return datasets;
}

async function resultadoDe(dataset: string, sql: string): Promise<ResultadoSQL> {
  const ds = (await datasetsListos()).get(dataset);
  if (!ds) throw new Error(`Dataset desconocido en el fixture: ${dataset}`);
  const r = await ejecutar(ds.bytes, sql);
  if (!r.ok) throw new Error(`El SQL del fixture falla (${r.error.titulo}: ${r.error.detalle}): ${sql}`);
  return { columnas: r.resultado.columnas, filas: r.resultado.filas };
}

export function modulosMock(): Modulo[] {
  return MODULOS_FIXTURE.map((m) => ({
    ...m,
    lecciones: LECCIONES_EN_ORDEN.filter((l) => l.modulo === m.slug).map((l) => ({
      slug: l.slug,
      orden: l.orden,
      titulo: l.titulo,
      resumen: l.resumen,
      duracion_min: l.duracion_min,
      dataset: l.dataset,
      tags: l.tags,
      ejercicios: l.ejercicios.map((_, i) => ({ id: `${l.slug}-${i + 1}`, orden: i + 1 })),
    })),
  }));
}

const cacheLecciones = new Map<string, Leccion>();

export async function leccionMock(slug: string): Promise<Leccion | null> {
  const cacheada = cacheLecciones.get(slug);
  if (cacheada) return cacheada;
  const idx = LECCIONES_EN_ORDEN.findIndex((l) => l.slug === slug);
  if (idx < 0) return null;
  const l = LECCIONES_EN_ORDEN[idx];
  const modulo = MODULOS_FIXTURE.find((m) => m.slug === l.modulo)!;
  const secciones: Seccion[] = [];
  for (const [i, s] of l.secciones.entries()) {
    secciones.push({
      orden: i + 1,
      titulo: s.titulo,
      cuerpo_md: s.cuerpo_md,
      ejemplo: s.ejemplo
        ? { sql: s.ejemplo.sql, nota: s.ejemplo.nota ?? null, resultado: await resultadoDe(l.dataset, s.ejemplo.sql) }
        : null,
      tip: s.tip ?? null,
    });
  }
  const leccion: Leccion = {
    slug: l.slug,
    orden: l.orden,
    titulo: l.titulo,
    resumen: l.resumen,
    duracion_min: l.duracion_min,
    modulo: { slug: modulo.slug, nombre: modulo.nombre },
    dataset: l.dataset,
    tags: l.tags,
    aprenderas: l.aprenderas,
    secciones,
    ejercicios: l.ejercicios.map((_, i) => ({ id: `${l.slug}-${i + 1}`, orden: i + 1 })),
    anterior: LECCIONES_EN_ORDEN[idx - 1]?.slug ?? null,
    siguiente: LECCIONES_EN_ORDEN[idx + 1]?.slug ?? null,
  };
  cacheLecciones.set(slug, leccion);
  return leccion;
}

export async function ejercicioMock(id: string): Promise<Ejercicio | null> {
  const m = /^(.+)-(\d+)$/.exec(id);
  if (!m) return null;
  const l = LECCIONES_EN_ORDEN.find((x) => x.slug === m[1]);
  const orden = Number(m[2]);
  const e = l?.ejercicios[orden - 1];
  if (!l || !e) return null;
  return {
    id,
    leccion_slug: l.slug,
    orden,
    total_en_leccion: l.ejercicios.length,
    enunciado_md: e.enunciado_md,
    dataset: l.dataset,
    ordenado: e.ordenado ?? false,
    resultado_esperado: await resultadoDe(l.dataset, e.solucion_sql),
  };
}
