import { api, descargar } from './cliente';
import type { Dataset, Ejercicio, Leccion, Modulo } from './tipos';

export const obtenerModulos = () => api<Modulo[]>('/api/lecciones/modulos', { auth: false });
export const obtenerLeccion = (slug: string) => api<Leccion>(`/api/lecciones/lecciones/${encodeURIComponent(slug)}`, { auth: false });
export const obtenerEjercicio = (id: string) => api<Ejercicio>(`/api/lecciones/ejercicios/${encodeURIComponent(id)}`, { auth: false });
export const obtenerDataset = (slug: string) => api<Dataset>(`/api/lecciones/datasets/${encodeURIComponent(slug)}`, { auth: false });

const archivos = new Map<string, Promise<Uint8Array>>();

/** Archivo .sqlite del dataset, cacheado en memoria por `archivo_sha256`. */
export function obtenerArchivoDataset(dataset: Pick<Dataset, 'archivo_url' | 'archivo_sha256'>): Promise<Uint8Array> {
  let promesa = archivos.get(dataset.archivo_sha256);
  if (!promesa) {
    promesa = descargar(dataset.archivo_url).then((buf) => new Uint8Array(buf));
    archivos.set(dataset.archivo_sha256, promesa);
    promesa.catch(() => archivos.delete(dataset.archivo_sha256));
  }
  return promesa;
}

export function vaciarCacheArchivos(): void {
  archivos.clear();
}
