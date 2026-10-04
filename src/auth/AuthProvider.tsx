import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ApiError, registrarManejadorSesionExpirada } from '../api/cliente';
import { obtenerPerfil } from '../api/usuarios';
import type { Usuario } from '../api/tipos';
import { useToast } from '../components/toast-contexto';
import { AuthContexto } from './auth-contexto';
import { borrarToken, guardarToken, leerToken } from './token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(() => leerToken() !== null);
  const [saliendo, setSaliendo] = useState(false);
  const navegar = useNavigate();
  const toast = useToast();
  const queries = useQueryClient();
  const sesionActiva = useRef(false);

  const limpiar = useCallback(() => {
    borrarToken();
    sesionActiva.current = false;
    setUsuario(null);
    queries.clear();
  }, [queries]);

  // Al abrir la app: si hay token, recuperar el usuario.
  useEffect(() => {
    if (leerToken() === null) return;
    let cancelado = false;
    obtenerPerfil()
      .then((u) => {
        if (cancelado) return;
        sesionActiva.current = true;
        setUsuario(u);
      })
      .catch((e: unknown) => {
        if (cancelado) return;
        // 401/404: el token ya no sirve. Otros errores (red, 5xx): se conserva el token para reintentar al recargar.
        if (e instanceof ApiError && (e.status === 401 || e.status === 404)) borrarToken();
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Cualquier servicio que responda 401 NO_AUTENTICADO cierra la sesión.
  useEffect(() => {
    registrarManejadorSesionExpirada(() => {
      if (!sesionActiva.current) return;
      limpiar();
      setSaliendo(true);
      toast.mostrar('Tu sesión expiró. Inicia sesión de nuevo.');
      navegar('/login', { replace: true });
    });
    return () => registrarManejadorSesionExpirada(null);
  }, [limpiar, navegar, toast]);

  const iniciarSesion = useCallback(
    (token: string, u: Usuario) => {
      queries.clear();
      guardarToken(token);
      sesionActiva.current = true;
      setUsuario(u);
      setSaliendo(false);
      setCargando(false);
    },
    [queries],
  );

  const cerrarSesion = useCallback(() => {
    limpiar();
    setSaliendo(true);
    toast.mostrar('Cerraste sesión');
    navegar('/');
  }, [limpiar, navegar, toast]);

  const valor = useMemo(
    () => ({ usuario, cargando, saliendo, iniciarSesion, cerrarSesion, actualizarUsuario: setUsuario }),
    [usuario, cargando, saliendo, iniciarSesion, cerrarSesion],
  );

  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}
