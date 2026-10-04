import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { LayoutApp, LayoutAuto, LayoutPublico } from './components/Layouts';
import Dashboard from './pages/Dashboard';
import Ejercicio from './pages/Ejercicio';
import Home from './pages/Home';
import Leccion from './pages/Leccion';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Perfil from './pages/Perfil';
import Playground from './pages/Playground';
import Progreso from './pages/Progreso';
import Registro from './pages/Registro';
import Ruta from './pages/Ruta';

/** Al cambiar de pantalla se vuelve arriba (salvo que se pida bajar a una sección de la home). */
function ScrollArriba() {
  const { pathname, state } = useLocation();
  const scroll = (state as { scroll?: string } | null)?.scroll;
  useEffect(() => {
    if (!scroll) window.scrollTo(0, 0);
  }, [pathname, scroll]);
  return null;
}

export function Rutas() {
  return (
    <>
      <ScrollArriba />
      <Routes>
        <Route element={<LayoutPublico />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Route>
        <Route element={<LayoutApp />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ruta" element={<Ruta />} />
          <Route path="/ruta/:slug" element={<Ruta />} />
          <Route path="/leccion/:slug" element={<Leccion />} />
          <Route path="/ejercicio/:id" element={<Ejercicio />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/playground" element={<Playground />} />
        </Route>
        <Route element={<LayoutAuto />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
