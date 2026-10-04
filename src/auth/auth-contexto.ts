import { createContext, useContext } from 'react';
import type { Usuario } from '../api/tipos';

export interface AuthApi {
  usuario: Usuario | null;
  /** `true` mientras se verifica el token guardado con `GET /api/usuarios/me` al abrir la app. */
  cargando: boolean;
  /** `true` justo después de cerrar la sesión (o de que expire), hasta que se inicie otra. Evita avisos de «inicia sesión» durante la salida. */
  saliendo: boolean;
  /** Guarda el token y deja la sesión iniciada (se llama tras un login o registro exitoso). */
  iniciarSesion: (token: string, usuario: Usuario) => void;
  /** Cierra la sesión, avisa y lleva al inicio. */
  cerrarSesion: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
}

export const AuthContexto = createContext<AuthApi | null>(null);

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContexto);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
