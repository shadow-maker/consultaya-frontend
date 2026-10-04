import { useTitulo } from './useTitulo';

export default function Ruta() {
  useTitulo('Ruta');
  return (
    <div className="wrap page">
      <div className="card empty">
        <h2>Ruta</h2>
        <p className="muted">Esta pantalla está en construcción.</p>
      </div>
    </div>
  );
}
