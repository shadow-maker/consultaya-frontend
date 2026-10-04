import type { EstadoLeccion, Resumen, Ruta } from '../api/tipos';
import { ESTRUCTURA } from './contenido';
import { mock } from './estado';

const porcentaje = (hechos: number, total: number) => (total ? Math.round((100 * hechos) / total) : 0);

function estadoDe(usuarioId: string) {
  return { completados: mock.estado.completados[usuarioId] ?? {}, visitas: mock.estado.visitas[usuarioId] ?? {} };
}

export function rutaDe(usuarioId: string): Ruta {
  const { completados, visitas } = estadoDe(usuarioId);
  return {
    modulos: ESTRUCTURA.map((m) => {
      let hechos = 0;
      let total = 0;
      const lecciones = m.lecciones.map((l) => {
        const h = l.ejercicios.filter((id) => completados[id]).length;
        hechos += h;
        total += l.ejercicios.length;
        const estado: EstadoLeccion = h === l.ejercicios.length ? 'completada' : h > 0 || visitas[l.slug] ? 'en_curso' : 'pendiente';
        return { slug: l.slug, estado, completados: h, total: l.ejercicios.length };
      });
      return { slug: m.slug, completados: hechos, total, porcentaje: porcentaje(hechos, total), lecciones };
    }),
  };
}

export function resumenDe(usuarioId: string): Resumen {
  const { completados } = estadoDe(usuarioId);
  const ruta = rutaDe(usuarioId);
  const hechos = ruta.modulos.reduce((a, m) => a + m.completados, 0);
  const total = ruta.modulos.reduce((a, m) => a + m.total, 0);
  const lecciones = ruta.modulos.flatMap((m) => m.lecciones);

  let siguiente: Resumen['siguiente'] = null;
  for (const m of ESTRUCTURA) {
    const l = m.lecciones.find((x) => x.ejercicios.some((id) => !completados[id]));
    if (l) {
      const tieneAvance = l.ejercicios.some((id) => completados[id]);
      siguiente = { leccion_slug: l.slug, ejercicio_id: tieneAvance ? (l.ejercicios.find((id) => !completados[id]) ?? null) : null };
      break;
    }
  }

  const lista = Object.entries(completados)
    .map(([ejercicio_id, c]) => ({ ejercicio_id, leccion_slug: c.leccion_slug, completado_en: c.completado_en }))
    .sort((a, b) => b.completado_en.localeCompare(a.completado_en));

  return {
    completados: hechos,
    total,
    porcentaje: porcentaje(hechos, total),
    lecciones_completadas: lecciones.filter((l) => l.estado === 'completada').length,
    lecciones_total: lecciones.length,
    modulos_completados: ruta.modulos.filter((m) => m.completados === m.total).length,
    modulos_total: ruta.modulos.length,
    modulos: ruta.modulos.map(({ slug, completados: c, total: t, porcentaje: p }) => ({ slug, completados: c, total: t, porcentaje: p })),
    siguiente,
    ejercicios_completados: lista,
    ultimo_completado_en: lista[0]?.completado_en ?? null,
  };
}

export const leccionExiste = (slug: string) => ESTRUCTURA.some((m) => m.lecciones.some((l) => l.slug === slug));
export const ejercicioInfo = (id: string) => {
  for (const m of ESTRUCTURA) for (const l of m.lecciones) if (l.ejercicios.includes(id)) return { leccion_slug: l.slug };
  return null;
};
