/** Tipos del contrato de la API (docs/02-contratos-api.md, v1). JSON en snake_case. */
import type { ResultadoSQL } from '../sql/tipos';

export type { ResultadoSQL };

// ---------- Errores ----------
export interface ErrorApiCuerpo {
  error: { codigo: string; mensaje: string; campos: Record<string, string> | null };
}

// ---------- usuarios ----------
export type Plan = 'gratis' | 'pro';

export interface Usuario {
  id: string;
  nombres: string;
  email: string;
  plan: Plan;
  creado_en: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface RegistroPeticion {
  nombres: string;
  email: string;
  password: string;
}

export interface LoginPeticion {
  email: string;
  password: string;
}

// ---------- lecciones ----------
export interface EjercicioRef {
  id: string;
  orden: number;
}

export interface LeccionEnModulo {
  slug: string;
  orden: number;
  titulo: string;
  resumen: string;
  duracion_min: number;
  dataset: string;
  tags: string[];
  ejercicios: EjercicioRef[];
}

export interface Modulo {
  slug: string;
  nombre: string;
  descripcion: string;
  orden: number;
  lecciones: LeccionEnModulo[];
}

export interface EjemploSeccion {
  sql: string;
  nota: string | null;
  resultado: ResultadoSQL;
}

export interface Seccion {
  orden: number;
  titulo: string;
  cuerpo_md: string;
  ejemplo: EjemploSeccion | null;
  tip: string | null;
}

export interface Leccion {
  slug: string;
  orden: number;
  titulo: string;
  resumen: string;
  duracion_min: number;
  modulo: { slug: string; nombre: string };
  dataset: string;
  tags: string[];
  aprenderas: string[];
  secciones: Seccion[];
  ejercicios: EjercicioRef[];
  anterior: string | null;
  siguiente: string | null;
}

export interface Ejercicio {
  id: string;
  leccion_slug: string;
  orden: number;
  total_en_leccion: number;
  enunciado_md: string;
  dataset: string;
  ordenado: boolean;
  resultado_esperado: ResultadoSQL;
}

export interface DatasetColumna {
  nombre: string;
  tipo: string;
}

export interface DatasetTabla {
  nombre: string;
  descripcion: string;
  filas_total: number;
  columnas: DatasetColumna[];
  muestra: ResultadoSQL;
}

export interface Dataset {
  slug: string;
  nombre: string;
  lugar: string;
  descripcion: string;
  icono: string;
  archivo_url: string;
  archivo_sha256: string;
  tablas: DatasetTabla[];
}

// ---------- progreso ----------
export type EstadoLeccion = 'pendiente' | 'en_curso' | 'completada';

export interface RutaLeccion {
  slug: string;
  estado: EstadoLeccion;
  completados: number;
  total: number;
}

export interface RutaModulo {
  slug: string;
  completados: number;
  total: number;
  porcentaje: number;
  lecciones: RutaLeccion[];
}

export interface Ruta {
  modulos: RutaModulo[];
}

export interface ResumenModulo {
  slug: string;
  completados: number;
  total: number;
  porcentaje: number;
}

export interface EjercicioCompletado {
  ejercicio_id: string;
  leccion_slug: string;
  completado_en: string;
}

export interface Resumen {
  completados: number;
  total: number;
  porcentaje: number;
  lecciones_completadas: number;
  lecciones_total: number;
  modulos_completados: number;
  modulos_total: number;
  modulos: ResumenModulo[];
  siguiente: { leccion_slug: string; ejercicio_id: string | null } | null;
  ejercicios_completados: EjercicioCompletado[];
  ultimo_completado_en: string | null;
}

export interface CompletarRespuesta {
  ejercicio_id: string;
  completado_en: string;
  nuevo: boolean;
}
