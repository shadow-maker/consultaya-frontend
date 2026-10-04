import type { EstadoLeccion } from '../api/tipos';
import { Icon } from './Icon';

const CLASE: Record<EstadoLeccion, string> = { completada: 'completada', en_curso: 'curso', pendiente: 'pendiente' };
const ETIQUETA_ESTADO: Record<EstadoLeccion, string> = { completada: 'Completada', en_curso: 'En curso', pendiente: 'Pendiente' };

/** Punto de estado de una lección o ejercicio. */
export function PuntoEstado({ estado }: { estado: EstadoLeccion }) {
  return (
    <span className={`dot ${CLASE[estado]}`} title={ETIQUETA_ESTADO[estado]} role="img" aria-label={ETIQUETA_ESTADO[estado]}>
      {estado === 'completada' && <Icon name="check" />}
    </span>
  );
}

export function ChipEstado({ estado, testId }: { estado: EstadoLeccion; testId?: string }) {
  return (
    <span className={`chip st-${CLASE[estado]}`} data-testid={testId} data-estado={estado}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

export function Barra({ porcentaje, grande = false }: { porcentaje: number; grande?: boolean }) {
  return (
    <div className={`bar ${grande ? 'lg' : ''}`} role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${porcentaje}%` }} />
    </div>
  );
}

const CIRCUNFERENCIA = 2 * Math.PI * 48;

/** Anillo de avance general del dashboard. */
export function Anillo({ porcentaje }: { porcentaje: number }) {
  return (
    <div className="ring">
      <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r="48" fill="none" stroke="#EEF1F4" strokeWidth="12" />
        {porcentaje > 0 && (
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="#0E7C66"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - porcentaje / 100)}
          />
        )}
      </svg>
      <b>{porcentaje}%</b>
    </div>
  );
}
