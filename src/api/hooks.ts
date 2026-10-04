import { useQuery } from '@tanstack/react-query';
import { obtenerArchivoDataset, obtenerDataset, obtenerEjercicio, obtenerLeccion, obtenerModulos } from './lecciones';
import { obtenerResumen, obtenerRuta } from './progreso';
import type { Dataset } from './tipos';

/** Claves de TanStack Query. Todo lo de progreso cuelga de `['progreso']` para invalidarlo junto. */
export const claves = {
  modulos: ['modulos'] as const,
  leccion: (slug: string) => ['leccion', slug] as const,
  ejercicio: (id: string) => ['ejercicio', id] as const,
  dataset: (slug: string) => ['dataset', slug] as const,
  archivo: (sha: string) => ['archivo', sha] as const,
  progreso: ['progreso'] as const,
  ruta: ['progreso', 'ruta'] as const,
  resumen: ['progreso', 'resumen'] as const,
};

export const useModulos = () => useQuery({ queryKey: claves.modulos, queryFn: obtenerModulos, staleTime: 5 * 60_000 });

export const useLeccion = (slug: string | undefined) =>
  useQuery({ queryKey: claves.leccion(slug ?? ''), queryFn: () => obtenerLeccion(slug!), enabled: !!slug, staleTime: 5 * 60_000 });

export const useEjercicio = (id: string | undefined) =>
  useQuery({ queryKey: claves.ejercicio(id ?? ''), queryFn: () => obtenerEjercicio(id!), enabled: !!id, staleTime: 5 * 60_000 });

export const useDataset = (slug: string | undefined) =>
  useQuery({ queryKey: claves.dataset(slug ?? ''), queryFn: () => obtenerDataset(slug!), enabled: !!slug, staleTime: 5 * 60_000 });

/** Bytes del .sqlite (cacheados por `archivo_sha256`). */
export const useArchivoDataset = (dataset: Dataset | undefined) =>
  useQuery({
    queryKey: claves.archivo(dataset?.archivo_sha256 ?? ''),
    queryFn: () => obtenerArchivoDataset(dataset!),
    enabled: !!dataset,
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const useRuta = () => useQuery({ queryKey: claves.ruta, queryFn: obtenerRuta });
export const useResumen = () => useQuery({ queryKey: claves.resumen, queryFn: obtenerResumen });
