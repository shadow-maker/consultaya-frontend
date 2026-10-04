import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-contexto';
import { initials } from '../sql/formato';
import { seccionActiva } from './seccion';
import { Icon } from './Icon';
import { Logo } from './Logo';

function Marca({ href }: { href: string }) {
  return (
    <Link className="brand" to={href} aria-label="ConsultaYa, inicio">
      <Logo />
      <span>
        Consulta<b>Ya</b>
      </span>
    </Link>
  );
}

const SECCIONES_HOME = [
  ['como', 'Cómo funciona'],
  ['datasets', 'Datasets'],
  ['comparativa', '¿Por qué ConsultaYa?'],
  ['precios', 'Precios'],
] as const;

/** Barra de la landing, el login y el registro. */
export function TopbarPublico() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const navegar = useNavigate();

  const irA = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navegar('/', { state: { scroll: id } });
  };

  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <Marca href="/" />
        <nav className="nav nav-public" aria-label="Secciones">
          {SECCIONES_HOME.map(([id, texto]) => (
            <a key={id} href="#/" onClick={irA(id)}>
              {texto}
            </a>
          ))}
        </nav>
        <div className="topbar-right">
          {usuario ? (
            <Link className="btn primary sm" to="/dashboard">
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link className="btn ghost sm" to="/login">
                Iniciar sesión
              </Link>
              <Link className="btn primary sm" to="/registro">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const ENLACES_APP = [
  ['dashboard', 'Inicio'],
  ['ruta', 'Ruta de aprendizaje'],
  ['progreso', 'Mi progreso'],
  ['playground', 'Modo libre'],
] as const;

/** Barra de las pantallas con sesión. */
export function TopbarApp() {
  const { usuario, cerrarSesion } = useAuth();
  const { pathname } = useLocation();
  const activa = seccionActiva(pathname);
  // Se guarda en qué ruta se abrió: al navegar, el menú queda cerrado sin necesidad de un efecto.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === pathname;
  const menu = useRef<HTMLDetailsElement>(null);

  // El menú se cierra al navegar, con Escape y al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setAbiertoEn(null);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setAbiertoEn(null);
    document.addEventListener('click', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  if (!usuario) return null;
  const pro = usuario.plan === 'pro';

  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <Marca href="/dashboard" />
        <nav className="nav" aria-label="Principal">
          {ENLACES_APP.map(([k, texto]) => (
            <Link key={k} to={`/${k}`} className={activa === k ? 'active' : ''} aria-current={activa === k ? 'page' : undefined}>
              {texto}
            </Link>
          ))}
        </nav>
        <div className="topbar-right">
          <span className={`plan-pill ${pro ? 'pro' : ''}`}>{pro ? 'Pro' : 'Gratis'}</span>
          <details className="menu" ref={menu} open={abierto}>
            <summary
              className="avatar"
              aria-label="Menú de usuario"
              data-testid="menu-usuario"
              onClick={(e) => {
                e.preventDefault();
                setAbiertoEn(abierto ? null : pathname);
              }}
            >
              {initials(usuario.nombres)}
            </summary>
            <div className="menu-pop">
              <div className="who">
                <b>{usuario.nombres}</b>
                <div className="muted small">{usuario.email}</div>
              </div>
              <Link to="/perfil">
                <Icon name="user" /> Perfil y membresía
              </Link>
              <Link to="/progreso">
                <Icon name="chart" /> Mi progreso
              </Link>
              <button type="button" data-testid="cerrar-sesion" onClick={cerrarSesion}>
                <Icon name="logout" /> Cerrar sesión
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
