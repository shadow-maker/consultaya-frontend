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
