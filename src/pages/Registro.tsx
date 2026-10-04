import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router';
import { ApiError } from '../api/cliente';
import { registrar } from '../api/usuarios';
import { useAuth } from '../auth/auth-contexto';
import { AuthLateral } from '../components/AuthLateral';
import { Icon } from '../components/Icon';
import { useToast } from '../components/toast-contexto';
import { EMAIL_VALIDO, primerNombre } from '../utilidades';
import { useTitulo } from './useTitulo';

type Campo = 'nombres' | 'email' | 'password';
type Errores = Partial<Record<Campo, string>>;

const CAMPOS: Campo[] = ['nombres', 'email', 'password'];

export default function Registro() {
  useTitulo('Crear cuenta');
  const { usuario, iniciarSesion } = useAuth();
  const toast = useToast();

  const [nombres, setNombres] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorForm, setErrorForm] = useState<ReactNode>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  if (usuario) return <Navigate to={registrado ? '/ruta' : '/dashboard'} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    const nombresLimpios = nombres.trim().replace(/\s+/g, ' ');
    const correo = email.trim().toLowerCase();
    const nuevos: Errores = {};
    if (!nombresLimpios) nuevos.nombres = 'Ingresa tus nombres.';
    if (!EMAIL_VALIDO.test(correo)) nuevos.email = 'Ingresa un correo electrónico válido.';
    if (password.length < 8) nuevos.password = 'La contraseña debe tener al menos 8 caracteres.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      const sesion = await registrar({ nombres: nombresLimpios, email: correo, password });
      toast.mostrar(`¡Cuenta creada! Te damos la bienvenida, ${primerNombre(sesion.usuario.nombres)}.`);
      setRegistrado(true);
      iniciarSesion(sesion.token, sesion.usuario);
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'CORREO_EN_USO') {
        setErrores({ email: '' });
        setErrorForm(
          <>
            <b>Este correo ya está en uso.</b> Si es tuyo, <Link to="/login">inicia sesión</Link>.
          </>,
        );
      } else if (err instanceof ApiError && err.codigo === 'VALIDACION' && err.campos) {
        const delServidor: Errores = {};
        const otros: string[] = [];
        for (const [campo, mensaje] of Object.entries(err.campos)) {
          if ((CAMPOS as string[]).includes(campo)) delServidor[campo as Campo] = mensaje;
          else otros.push(mensaje);
        }
        setErrores(delServidor);
        if (otros.length) setErrorForm(otros.join(' '));
      } else {
        setErrorForm(err instanceof ApiError ? err.message : 'No pudimos crear tu cuenta. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  const campo = (c: Campo) => ({
    className: errores[c] !== undefined ? 'invalid' : undefined,
    'aria-invalid': errores[c] !== undefined ? (true as const) : undefined,
    'aria-describedby': errores[c] ? `err-${c}` : undefined,
  });

  return (
    <div className="auth-wrap">
      <div className="auth-main">
        <div className="auth-card">
          <p className="eyebrow">Empieza gratis</p>
          <h1>Crea tu cuenta</h1>
          <p className="muted">Guarda tu avance y continúa desde cualquier dispositivo.</p>
          <form className="stack" noValidate onSubmit={enviar} aria-busy={enviando}>
            <label className="f">
              Nombres
              <input
                type="text"
                name="nombres"
                autoComplete="name"
                required
                data-testid="registro-nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                {...campo('nombres')}
              />
              <span className="field-err" id="err-nombres">
                {errores.nombres}
              </span>
            </label>
            <label className="f">
              Correo electrónico
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                data-testid="registro-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                {...campo('email')}
              />
              <span className="field-err" id="err-email">
                {errores.email}
              </span>
            </label>
            <label className="f">
              Contraseña
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                required
                data-testid="registro-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...campo('password')}
              />
              <span className="field-err" id="err-password">
                {errores.password}
              </span>
              <span className="muted small" style={{ fontWeight: 400 }}>
                Mínimo 8 caracteres.
              </span>
            </label>
            {errorForm && (
              <div className="form-error" role="alert" data-testid="form-error">
                <Icon name="alert" />
                <span>{errorForm}</span>
              </div>
            )}
            <button className="btn primary lg block" type="submit" disabled={enviando} data-testid="registro-submit">
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
          <p className="muted center" style={{ marginTop: 16 }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
          {import.meta.env.DEV && (
            <div className="demo-hint">
              Para probar el escenario de <b>correo ya registrado</b> (solo desarrollo), usa <code>demo@consultaya.pe</code>.
            </div>
          )}
        </div>
      </div>
      <AuthLateral />
    </div>
  );
}
