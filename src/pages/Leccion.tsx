import { useTitulo } from './useTitulo';

export default function Leccion() {
  useTitulo('Leccion');
  return (
    <div className="wrap page">
      <div className="card empty">
        <h2>Leccion</h2>
        <p className="muted">Esta pantalla está en construcción.</p>
      </div>
    </div>
  );
}
