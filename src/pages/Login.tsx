import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ApiError } from '../api/cliente';
import { iniciarSesionApi } from '../api/usuarios';
import { useAuth } from '../auth/auth-contexto';
import { AuthLateral } from '../components/AuthLateral';
import { Icon } from '../components/Icon';
import { useToast } from '../components/toast-contexto';
import { primerNombre } from '../utilidades';
import { useTitulo } from './useTitulo';

export default function Login() {
  useTitulo('Iniciar sesión');
  const { usuario, iniciarSesion } = useAuth();
  const toast = useToast();
  const ubicacion = useLocation();
  const desde = (ubicacion.state as { desde?: string } | null)?.desde;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ReactNode>(null);
  const [enviando, setEnviando] = useState(false);
  const [destino, setDestino] = useState<string | null>(null);
  const campoPassword = useRef<HTMLInputElement>(null);

  // Con sesión iniciada no se muestra el login; tras entrar se vuelve a la ruta que se quería abrir.
  if (usuario) return <Navigate to={destino ?? '/dashboard'} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const correo = email.trim().toLowerCase();
    if (!correo || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    setEnviando(true);
    try {
      const sesion = await iniciarSesionApi({ email: correo, password });
      toast.mostrar(`¡Hola de nuevo, ${primerNombre(sesion.usuario.nombres)}!`);
      setDestino(desde ?? '/dashboard');
      iniciarSesion(sesion.token, sesion.usuario);
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'CREDENCIALES_INVALIDAS') {
        setError(
          <>
            <b>Credenciales inválidas.</b> El correo o la contraseña no son correctos. Verifica tus datos e inténtalo de nuevo.
          </>,
        );
        setPassword('');
        campoPassword.current?.focus();
      } else {
        setError(err instanceof ApiError ? err.message : 'No pudimos iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-main">
        <div className="auth-card">
          <p className="eyebrow">Bienvenido de vuelta</p>
          <h1>Inicia sesión</h1>
          <p className="muted">Continúa donde te quedaste.</p>
          <form className="stack" noValidate onSubmit={enviar} aria-busy={enviando}>
            <label className="f">
              Correo electrónico
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                data-testid="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="f">
              Contraseña
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                data-testid="login-password"
                ref={campoPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <div className="form-error" role="alert" data-testid="form-error">
                <Icon name="alert" />
                <span>{error}</span>
              </div>
            )}
            <button className="btn primary lg block" type="submit" disabled={enviando} data-testid="login-submit">
              {enviando ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="muted center" style={{ marginTop: 16 }}>
            ¿No tienes cuenta? <Link to="/registro">Regístrate gratis</Link>
          </p>
          {import.meta.env.DEV && (
            <div className="demo-hint" data-testid="cuentas-prueba">
              <b>Cuentas de prueba (solo desarrollo)</b>
              <br />
              <code>demo@consultaya.pe</code> / <code>demo1234</code> (con avance)
              <br />
              <code>nuevo@consultaya.pe</code> / <code>nuevo1234</code> (sin avance)
            </div>
          )}
        </div>
      </div>
      <AuthLateral />
    </div>
  );
}
