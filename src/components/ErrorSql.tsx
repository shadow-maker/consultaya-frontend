import type { ErrorSql as ErrorSqlTipo } from '../sql/tipos';
import { Icon } from './Icon';

/** Error de la consulta explicado en español. «Solo lectura» usa el estilo de advertencia. */
export function ErrorSql({ error }: { error: ErrorSqlTipo }) {
  const soloLectura = error.tipo === 'solo_lectura';
  return (
    <div className={`feedback ${soloLectura ? 'warn' : 'err'}`} role="alert" data-testid="sql-error">
      <div className="fic">
        <Icon name={soloLectura ? 'shield' : 'alert'} />
      </div>
      <div>
        <h4>{error.titulo}</h4>
        <p>{error.detalle}</p>
        {error.pista && (
          <div className="pista">
            <Icon name="bulb" />
            <span>{error.pista}</span>
          </div>
        )}
      </div>
    </div>
  );
}
