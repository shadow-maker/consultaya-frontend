import { useTitulo } from './useTitulo';

export default function Ejercicio() {
  useTitulo('Ejercicio');
  return (
    <div className="wrap page">
      <div className="card empty">
        <h2>Ejercicio</h2>
        <p className="muted">Esta pantalla está en construcción.</p>
      </div>
    </div>
  );
}
