import type { DatasetTabla } from '../api/tipos';
import { plural } from '../sql/comparar';
import { Icon } from './Icon';
import { TablaResultado } from './TablaResultado';

interface Props {
  tablas: DatasetTabla[];
  /** Clic en una columna: se inserta en el editor. */
  onColumna?: (nombre: string) => void;
}

/** Tablas del dataset: descripción, columnas clicables y 5 filas de ejemplo. */
export function Esquema({ tablas, onColumna }: Props) {
  return (
    <div data-testid="esquema">
      {tablas.map((t) => (
        <div className="schema-table" key={t.nombre}>
          <div className="schema-top">
            <Icon name="table" />
            <b style={{ fontFamily: 'var(--mono)' }}>{t.nombre}</b>
            <span className="muted small">· {plural(t.filas_total, 'fila')}</span>
          </div>
          <p className="schema-desc">{t.descripcion}</p>
          <div className="cols">
            {t.columnas.map((c) => (
              <button
                type="button"
                className="col-pill"
                key={c.nombre}
                title={`Insertar «${c.nombre}» en el editor`}
                onClick={() => onColumna?.(c.nombre)}
              >
                {c.nombre}
                <em>{c.tipo}</em>
              </button>
            ))}
          </div>
          <details>
            <summary>Ver datos de ejemplo</summary>
            <div className="preview">
              <TablaResultado resultado={t.muestra} />
              {t.filas_total > t.muestra.filas.length && (
                <p className="muted small" style={{ margin: '6px 0 0' }}>
                  Mostrando {t.muestra.filas.length} de {t.filas_total} filas.
                </p>
              )}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
