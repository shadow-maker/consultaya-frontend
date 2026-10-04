import { useTitulo } from './useTitulo';

export default function Progreso() {
  useTitulo('Progreso');
  return (
    <div className="wrap page">
      <div className="card empty">
        <h2>Progreso</h2>
        <p className="muted">Esta pantalla está en construcción.</p>
      </div>
    </div>
  );
}
