import { useEffect, useRef, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useToast } from '../components/toast-contexto';
import { useAuth } from './auth-contexto';

/**
 * Protege rutas: sin sesión guarda la ruta deseada (en el estado de navegación) y manda a `#/login`.
 * Tras iniciar sesión, Login vuelve a esa ruta.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, cargando, saliendo } = useAuth();
  const ubicacion = useLocation();
  const toast = useToast();
  const avisado = useRef(false);
  const redirige = !cargando && !usuario && !saliendo;

  useEffect(() => {
    if (redirige && !avisado.current) {
      avisado.current = true;
      toast.mostrar('Inicia sesión para continuar');
    }
  }, [redirige, toast]);

  if (cargando) return <p className="wrap page muted" role="status">Cargando…</p>;
  if (!usuario) {
    if (saliendo) return null; // la sesión se cerró a propósito: quien la cerró ya está navegando
    const desde = ubicacion.pathname + ubicacion.search;
    return <Navigate to="/login" replace state={{ desde }} />;
  }
  return <>{children}</>;
}
