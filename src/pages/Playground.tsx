import { useTitulo } from './useTitulo';

export default function Playground() {
  useTitulo('Playground');
  return (
    <div className="wrap page">
      <div className="card empty">
        <h2>Playground</h2>
        <p className="muted">Esta pantalla está en construcción.</p>
      </div>
    </div>
  );
}
