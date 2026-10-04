import { plural } from '../sql/comparar';
import { fmtVal } from '../sql/formato';
import type { ResultadoSQL } from '../sql/tipos';

/** Tabla de resultados (columnas numéricas alineadas a la derecha, NULL en cursiva). */
export function TablaResultado({ resultado, testId }: { resultado: ResultadoSQL; testId?: string }) {
  const { columnas, filas } = resultado;
  const numerica = columnas.map((_, i) => filas.length > 0 && filas.every((f) => f[i] == null || typeof f[i] === 'number'));
  return (
    <div className="result-wrap" data-testid={testId}>
      <table className="data">
        <thead>
          <tr>
            {columnas.map((c, i) => (
              <th key={i} className={numerica[i] ? 'num' : ''}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={Math.max(columnas.length, 1)} className="empty-row">
                La consulta no devolvió filas.
              </td>
            </tr>
          ) : (
            filas.map((fila, r) => (
              <tr key={r}>
                {fila.map((v, i) =>
                  v === null ? (
                    <td key={i} className="null">
                      NULL
                    </td>
                  ) : (
                    <td key={i} className={numerica[i] ? 'num' : ''}>
                      {fmtVal(v)}
                    </td>
                  ),
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface BloqueProps {
  resultado: ResultadoSQL;
  truncado?: boolean;
}

/** «Resultado de tu consulta» + conteo de filas y columnas + la tabla. */
export function BloqueResultado({ resultado, truncado = false }: BloqueProps) {
  return (
    <div data-testid="resultado">
      <div className="res-head">
        <b>Resultado de tu consulta</b>
        <span className="muted small">
          {plural(resultado.filas.length, 'fila')} · {plural(resultado.columnas.length, 'columna')}
        </span>
      </div>
      <TablaResultado resultado={resultado} />
      {truncado && (
        <p className="muted small" style={{ margin: '6px 2px 0' }}>
          Se muestran solo las primeras {resultado.filas.length} filas. Agrega un LIMIT o un WHERE para acotar el resultado.
        </p>
      )}
    </div>
  );
}
