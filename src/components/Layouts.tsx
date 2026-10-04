import { Outlet } from 'react-router';
import { useAuth } from '../auth/auth-contexto';
import { RequireAuth } from '../auth/RequireAuth';
import { Footer } from './Footer';
import { TopbarApp, TopbarPublico } from './Topbar';

/** Landing, login y registro: barra pública. */
export function LayoutPublico() {
  return (
    <>
      <TopbarPublico />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

/** Pantallas con sesión: exige sesión y muestra la barra de la aplicación. */
export function LayoutApp() {
  return (
    <RequireAuth>
      <TopbarApp />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </RequireAuth>
  );
}

/** Rutas sin dueño (404): la barra depende de si hay sesión. */
export function LayoutAuto() {
  const { usuario } = useAuth();
  return (
    <>
      {usuario ? <TopbarApp /> : <TopbarPublico />}
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
