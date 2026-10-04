import type { Plan } from '../api/tipos';

export interface UsuarioMock {
  id: string;
  nombres: string;
  email: string;
  password: string;
  plan: Plan;
  creado_en: string;
}

export interface CompletadoMock {
  leccion_slug: string;
  completado_en: string;
  consulta_sql: string;
}

export interface EstadoMock {
  usuarios: UsuarioMock[];
  /** usuario_id → ejercicio_id → datos */
  completados: Record<string, Record<string, CompletadoMock>>;
  /** usuario_id → leccion_slug → primera visita */
  visitas: Record<string, Record<string, string>>;
}

export const ID_ANA = '11111111-1111-4111-8111-111111111111';
export const ID_DIEGO = '22222222-2222-4222-8222-222222222222';

/** Mismo seed que `scripts/seed_demo.py` de los servicios: Ana con avance, Diego sin avance. */
export function estadoInicial(): EstadoMock {
  const sol = (sql: string, leccion_slug: string, completado_en: string): CompletadoMock => ({ leccion_slug, completado_en, consulta_sql: sql });
  return {
    usuarios: [
      { id: ID_ANA, nombres: 'Ana Torres', email: 'demo@consultaya.pe', password: 'demo1234', plan: 'gratis', creado_en: '2026-08-15T12:00:00Z' },
      { id: ID_DIEGO, nombres: 'Diego Paredes', email: 'nuevo@consultaya.pe', password: 'nuevo1234', plan: 'gratis', creado_en: '2026-09-29T12:00:00Z' },
    ],
    completados: {
      [ID_ANA]: {
        'select-from-1': sol('SELECT * FROM productos', 'select-from', '2026-09-18T19:12:00Z'),
        'select-from-2': sol('SELECT nombre, precio FROM productos', 'select-from', '2026-09-18T19:20:00Z'),
        'where-1': sol("SELECT nombre, precio FROM productos WHERE categoria = 'Bebidas'", 'where', '2026-09-20T20:05:00Z'),
        'where-2': sol('SELECT nombre, stock FROM productos WHERE stock < 20', 'where', '2026-09-20T20:17:00Z'),
        'order-limit-1': sol('SELECT nombre, precio FROM productos ORDER BY precio DESC LIMIT 3', 'order-limit', '2026-09-24T21:03:00Z'),
      },
      [ID_DIEGO]: {},
    },
    visitas: {
      [ID_ANA]: { 'select-from': '2026-09-18T19:00:00Z', where: '2026-09-20T20:00:00Z', 'order-limit': '2026-09-24T21:00:00Z' },
      [ID_DIEGO]: {},
    },
  };
}

const CLAVE_PERSISTENCIA = 'consultaya.mock.estado';

export const mock = {
  estado: estadoInicial(),
  persistir: false,
};

export function reiniciarEstado(): void {
  mock.estado = estadoInicial();
  if (mock.persistir) {
    try {
      window.localStorage.removeItem(CLAVE_PERSISTENCIA);
    } catch {
      /* sin localStorage */
    }
  }
}

/** En el navegador el estado de los mocks sobrevive a recargar la página (se borra con `reiniciarEstado`). */
export function activarPersistencia(): void {
  mock.persistir = true;
  try {
    const guardado = window.localStorage.getItem(CLAVE_PERSISTENCIA);
    if (guardado) mock.estado = JSON.parse(guardado) as EstadoMock;
  } catch {
    /* estado corrupto o sin localStorage: se usa el inicial */
  }
}

export function guardarEstado(): void {
  if (!mock.persistir) return;
  try {
    window.localStorage.setItem(CLAVE_PERSISTENCIA, JSON.stringify(mock.estado));
  } catch {
    /* sin localStorage */
  }
}
