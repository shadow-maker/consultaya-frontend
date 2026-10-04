import { useTitulo } from './useTitulo';

export default function Dashboard() {
  useTitulo('Dashboard');
  return (
    <div className="wrap page">
      <div className="card empty">
        <h2>Dashboard</h2>
        <p className="muted">Esta pantalla está en construcción.</p>
      </div>
    </div>
  );
}
