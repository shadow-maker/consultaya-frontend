import { Link } from 'react-router';
import { useAuth } from '../auth/auth-contexto';
import { Icon } from '../components/Icon';
import { useTitulo } from './useTitulo';

export default function NotFound() {
  useTitulo('Página no encontrada');
  const { usuario } = useAuth();
  return (
    <div className="wrap page">
      <div className="card empty">
        <div className="big-ic">
          <Icon name="search" />
        </div>
        <h2>No encontramos esta página</h2>
        <p className="muted">Puede que el enlace esté mal escrito.</p>
        <Link className="btn primary" to={usuario ? '/dashboard' : '/'}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
