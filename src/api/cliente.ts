import { leerToken } from '../auth/token';
import type { ErrorApiCuerpo } from './tipos';

/** Error del API ya en el formato estándar: se decide por `codigo`, se muestra `mensaje`. */
export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly campos: Record<string, string> | null;

  constructor(status: number, codigo: string, mensaje: string, campos: Record<string, string> | null = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }
}

type Manejador = () => void;
let alSesionExpirada: Manejador | null = null;

/** El AuthProvider registra aquí qué hacer ante un 401 `NO_AUTENTICADO` (borrar token, avisar, ir a login). */
export function registrarManejadorSesionExpirada(fn: Manejador | null): void {
  alSesionExpirada = fn;
}

const MENSAJE_RED = 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PATCH';
  cuerpo?: unknown;
  /** Por defecto se envía el token si existe. */
  auth?: boolean;
}

async function leerError(resp: Response): Promise<ApiError> {
  try {
    const json = (await resp.json()) as Partial<ErrorApiCuerpo>;
    if (json?.error?.codigo) {
      return new ApiError(resp.status, json.error.codigo, json.error.mensaje ?? 'Ocurrió un error inesperado.', json.error.campos ?? null);
    }
  } catch {
    /* el cuerpo no era JSON (por ejemplo, una página de error de nginx) */
  }
  if (resp.status === 502 || resp.status === 503 || resp.status === 504) {
    return new ApiError(resp.status, 'SERVICIO_NO_DISPONIBLE', 'El servicio no está disponible por ahora. Intenta de nuevo en unos segundos.');
  }
  return new ApiError(resp.status, 'ERROR_INTERNO', 'Ocurrió un error inesperado. Intenta de nuevo.');
}

/** Llama a `/api/...` (siempre ruta relativa) y devuelve el JSON, o `undefined` en un 204. */
export async function api<T>(ruta: string, { metodo = 'GET', cuerpo, auth = true }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = auth ? leerToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  let resp: Response;
  try {
    resp = await fetch(ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  } catch {
    throw new ApiError(0, 'RED', MENSAJE_RED);
  }

  if (!resp.ok) {
    const error = await leerError(resp);
    if (error.status === 401 && error.codigo === 'NO_AUTENTICADO' && token) alSesionExpirada?.();
    throw error;
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

/** Descarga binaria (archivo .sqlite del dataset). */
export async function descargar(ruta: string): Promise<ArrayBuffer> {
  let resp: Response;
  try {
    resp = await fetch(ruta);
  } catch {
    throw new ApiError(0, 'RED', MENSAJE_RED);
  }
  if (!resp.ok) throw await leerError(resp);
  return resp.arrayBuffer();
}
