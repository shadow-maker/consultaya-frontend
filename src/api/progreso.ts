import { api } from './cliente';
import type { CompletarRespuesta, Resumen, Ruta } from './tipos';

export const registrarVisita = (leccionSlug: string) =>
  api<void>(`/api/progreso/lecciones/${encodeURIComponent(leccionSlug)}/visita`, { metodo: 'POST' });

export const completarEjercicio = (ejercicioId: string, consultaSql: string) =>
  api<CompletarRespuesta>(`/api/progreso/ejercicios/${encodeURIComponent(ejercicioId)}/completar`, {
    metodo: 'POST',
    cuerpo: { consulta_sql: consultaSql },
  });

export const obtenerRuta = () => api<Ruta>('/api/progreso/ruta');
export const obtenerResumen = () => api<Resumen>('/api/progreso/resumen');
