import { ApiError } from '../api/cliente';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="wrap page muted" role="status">
      {texto}
    </div>
  );
}

/** Error de carga con botón para reintentar. */
export function ErrorCarga({ error, onReintentar }: { error: unknown; onReintentar?: () => void }) {
  const mensaje = error instanceof ApiError ? error.message : 'No pudimos cargar esta pantalla. Intenta de nuevo.';
  return (
    <div className="wrap page">
      <div className="card empty" role="alert" data-testid="error-carga">
        <h2>Algo salió mal</h2>
        <p className="muted">{mensaje}</p>
        {onReintentar && (
          <button type="button" className="btn primary" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
