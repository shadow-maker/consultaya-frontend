import { useTitulo } from './useTitulo';

export default function Perfil() {
  useTitulo('Perfil');
  return (
    <div className="wrap page">
      <div className="card empty">
        <h2>Perfil</h2>
        <p className="muted">Esta pantalla está en construcción.</p>
      </div>
    </div>
  );
}
