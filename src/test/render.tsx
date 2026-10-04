import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Proveedores } from '../Proveedores';
import { crearQueryClient } from '../query-client';
import { Rutas } from '../Rutas';

/** Renderiza la app completa (rutas + sesión + toast + query) en memoria, empezando en `ruta`. */
export function renderApp(ruta: string | { pathname: string; state?: unknown } = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Proveedores cliente={crearQueryClient()}>
        <Rutas />
      </Proveedores>
    </MemoryRouter>,
  );
}

/** Inicia sesión contra los mocks y deja el token guardado (como si el usuario ya hubiera entrado). */
export async function conSesion(email: 'demo@consultaya.pe' | 'nuevo@consultaya.pe' = 'demo@consultaya.pe') {
  const password = email.startsWith('demo') ? 'demo1234' : 'nuevo1234';
  const resp = await fetch('/api/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { token } = (await resp.json()) as { token: string };
  window.localStorage.setItem('consultaya.token', token);
}
