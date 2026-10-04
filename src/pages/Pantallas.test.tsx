import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { conSesion, renderApp } from '../test/render';

describe('Ruta de aprendizaje (HU2)', () => {
  it('HU2-E1: 3 módulos con sus lecciones, estado y botón para abrir', async () => {
    await conSesion();
    renderApp('/ruta');
    for (const slug of ['basico', 'intermedio', 'avanzado']) expect(await screen.findByTestId(`modulo-${slug}`)).toBeInTheDocument();
    const basico = screen.getByTestId('modulo-basico');
    expect(within(basico).getByTestId('leccion-select-from')).toBeInTheDocument();
    expect(within(basico).getByTestId('leccion-estado-select-from')).toHaveTextContent('Completada');
    expect(within(basico).getByTestId('leccion-estado-order-limit')).toHaveTextContent('En curso');
    expect(within(screen.getByTestId('modulo-intermedio')).getByTestId('leccion-estado-group-by')).toHaveTextContent('Pendiente');
    expect(within(basico).getByTestId('leccion-abrir-where')).toHaveAttribute('href', '/leccion/where');
    expect(within(basico).getByTestId('leccion-abrir-where')).toHaveTextContent('Repasar');
    expect(within(basico).getByTestId('leccion-abrir-order-limit')).toHaveTextContent('Continuar');
    expect(within(screen.getByTestId('modulo-avanzado')).getByTestId('leccion-abrir-join')).toHaveTextContent('Abrir');
    expect(within(basico).getByText('83%')).toBeInTheDocument();
  });

  it('el buscador filtra la lista lateral sin tildes', async () => {
    await conSesion();
    renderApp('/ruta');
    await screen.findByTestId('modulo-basico');
    const lateral = screen.getByRole('complementary', { name: 'Explorador de lecciones' });
    await userEvent.type(within(lateral).getByRole('searchbox'), 'agrupar');
    expect(within(lateral).getByText(/Agrupar con GROUP BY/)).toBeInTheDocument();
    expect(within(lateral).queryByText('Filtrar filas con WHERE')).not.toBeInTheDocument();
    await userEvent.clear(within(lateral).getByRole('searchbox'));
    await userEvent.type(within(lateral).getByRole('searchbox'), 'zzzz');
    expect(within(lateral).getByText(/No encontramos lecciones/)).toBeInTheDocument();
  });

  it('/ruta/:slug muestra el resumen de la lección con sus ejercicios', async () => {
    await conSesion();
    renderApp('/ruta/order-limit');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ordenar y limitar resultados' })).toBeInTheDocument();
    expect(screen.getByText('1 de 2 ejercicios completados')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar lección' })).toHaveAttribute('href', '/leccion/order-limit');
    expect(screen.getByRole('link', { name: 'Ir a los ejercicios' })).toHaveAttribute('href', '/ejercicio/order-limit-2');
  });

  it('una lección inexistente muestra la pantalla de no encontrado', async () => {
    await conSesion();
    renderApp('/ruta/nada');
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument();
  });
});

describe('Lección (HU3)', () => {
  it('HU3-E1: explicación, ejemplo con tabla de resultado y botón a los ejercicios', async () => {
    await conSesion();
    renderApp('/leccion/where');
    expect(await screen.findByRole('heading', { level: 1, name: 'Filtrar filas con WHERE' })).toBeInTheDocument();
    const secciones = screen.getAllByTestId('seccion');
    expect(secciones).toHaveLength(2);
    expect(secciones[0]).toHaveTextContent('Muchas veces no necesitas todas las filas.');
    const resultados = screen.getAllByTestId('ejemplo-resultado');
    expect(resultados.length).toBeGreaterThanOrEqual(1);
    expect(resultados[0]).toHaveTextContent('Lucía Quispe');
    expect(screen.getByTestId('ir-ejercicios')).toHaveAttribute('href', '/ejercicio/where-1');
    // la tabla Markdown de operadores se renderiza como tabla
    expect(within(secciones[1]).getByRole('table')).toBeInTheDocument();
  });

  it('muestra el dataset y navegación anterior / siguiente', async () => {
    await conSesion();
    renderApp('/leccion/where');
    expect(await screen.findByText('Bodega Doña Rosa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Anterior/ })).toHaveAttribute('href', '/leccion/select-from');
    expect(screen.getByRole('link', { name: /Siguiente/ })).toHaveAttribute('href', '/leccion/order-limit');
  });

  it('abrir una lección la deja «en curso» en la ruta', async () => {
    await conSesion('nuevo@consultaya.pe');
    renderApp('/leccion/join');
    await screen.findByRole('heading', { level: 1, name: 'Combinar tablas con JOIN' });
    await userEvent.click(screen.getByRole('link', { name: 'Ruta' }));
    await waitFor(() => expect(screen.getByTestId('leccion-estado-join')).toHaveTextContent('En curso'));
  });

  it('no inserta HTML crudo del contenido', async () => {
    await conSesion();
    renderApp('/leccion/select-from');
    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelector('.lesson-body script')).toBeNull();
  });
});

describe('Mi progreso (HU5)', () => {
  it('HU5-E1: sin avance muestra «Aún no tienes avance» y el botón para empezar', async () => {
    await conSesion('nuevo@consultaya.pe');
    renderApp('/progreso');
    expect(await screen.findByTestId('progreso-vacio')).toHaveTextContent('Aún no tienes avance');
    expect(screen.getByTestId('progreso-empezar')).toHaveAttribute('href', '/leccion/select-from');
  });

  it('HU5-E2: con avance muestra el % por módulo y los ejercicios con fecha', async () => {
    await conSesion();
    renderApp('/progreso');
    const basico = await screen.findByTestId('progreso-modulo-basico');
    expect(basico).toHaveTextContent('83%');
    expect(basico).toHaveTextContent('5/6 ejercicios');
    expect(screen.getByTestId('progreso-modulo-intermedio')).toHaveTextContent('0%');
    const fila = screen.getByTestId('progreso-completado-where-1');
    expect(fila).toHaveTextContent('Ejercicio 1');
    expect(fila).toHaveTextContent('Filtrar filas con WHERE');
    expect(fila).toHaveTextContent(/20\/09\/2026/);
    // más reciente primero
    const filas = screen.getAllByTestId(/^progreso-completado-/);
    expect(filas[0]).toHaveAttribute('data-testid', 'progreso-completado-order-limit-1');
    expect(screen.getAllByRole('button', { name: /Descargar certificado/ })[0]).toBeDisabled();
  });
});

describe('Dashboard', () => {
  it('muestra el saludo, cómo continuar, avance, logros y certificados deshabilitados', async () => {
    await conSesion();
    renderApp('/dashboard');
    expect(await screen.findByText('Hola, Ana')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ordenar y limitar resultados' })).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-continuar')).toHaveAttribute('href', '/ejercicio/order-limit-2');
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getByTestId('logro-Primera consulta')).toHaveClass('on');
    expect(screen.getByTestId('logro-Buen filtro')).toHaveClass('on');
    expect(screen.getByTestId('logro-Módulo Básico')).not.toHaveClass('on');
    expect(screen.getByTestId('logro-Analista')).not.toHaveClass('on');
    expect(screen.getAllByRole('button', { name: /Descargar/ })[0]).toBeDisabled();
    expect(screen.getByText('Te faltan 1 ejercicio')).toBeInTheDocument();
  });

  it('usuario nuevo: «Empieza aquí» y la primera lección', async () => {
    await conSesion('nuevo@consultaya.pe');
    renderApp('/dashboard');
    expect(await screen.findByText('Empieza aquí')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-continuar')).toHaveAttribute('href', '/leccion/select-from');
  });
});

describe('Perfil', () => {
  it('edita los nombres y actualiza la barra con la respuesta del PATCH', async () => {
    await conSesion();
    renderApp('/perfil');
    const campo = await screen.findByTestId('perfil-nombres');
    expect(campo).toHaveValue('Ana Torres');
    await userEvent.clear(campo);
    await userEvent.type(campo, 'Ana María Torres');
    await userEvent.click(screen.getByTestId('perfil-guardar'));
    expect(await screen.findByTestId('toast')).toHaveTextContent('Datos actualizados');
    await userEvent.click(screen.getByTestId('menu-usuario'));
    expect(within(document.querySelector('.menu-pop') as HTMLElement).getByText('Ana María Torres')).toBeInTheDocument();
  });

  it('nombres vacíos muestran el error bajo el campo', async () => {
    await conSesion();
    renderApp('/perfil');
    await userEvent.clear(await screen.findByTestId('perfil-nombres'));
    await userEvent.click(screen.getByTestId('perfil-guardar'));
    expect(await screen.findByText('Ingresa tus nombres.')).toBeInTheDocument();
  });

  it('plan Gratis y «Mejorar a Pro» deshabilitado', async () => {
    await conSesion();
    renderApp('/perfil');
    expect(await screen.findByRole('heading', { name: 'Gratis' })).toBeInTheDocument();
    expect(screen.getByTestId('mejorar-pro')).toBeDisabled();
  });
});

describe('Modo libre (vista previa)', () => {
  it('ejecuta una consulta sobre el dataset elegido y permite cambiar de dataset', async () => {
    await conSesion();
    renderApp('/playground');
    await waitFor(() => expect(screen.getByTestId('ejecutar')).toBeEnabled(), { timeout: 5000 });
    await userEvent.click(screen.getByTestId('ejecutar'));
    expect(await screen.findByTestId('resultado')).toHaveTextContent('Bebidas');
    await userEvent.click(screen.getByRole('tab', { name: /RapiMenú/ }));
    await waitFor(() => expect(screen.getByText(/Pedidos de una app de delivery/)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('ejecutar')).toBeEnabled(), { timeout: 5000 });
    fireEvent.change(within(screen.getByTestId('editor')).getByRole('textbox'), { target: { value: 'DROP TABLE pedidos' } });
    await userEvent.click(screen.getByTestId('ejecutar'));
    expect(await screen.findByTestId('sql-error')).toHaveTextContent('Solo se permiten consultas SELECT');
  });
});

describe('Barra superior', () => {
  it('marca la sección activa, muestra el plan y permite cerrar sesión', async () => {
    await conSesion();
    renderApp('/progreso');
    const nav = await screen.findByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Mi progreso' })).toHaveClass('active');
    expect(within(nav).getByRole('link', { name: 'Inicio' })).not.toHaveClass('active');
    expect(screen.getByText('Gratis')).toBeInTheDocument();
    expect(screen.getByTestId('menu-usuario')).toHaveTextContent('AT');
    await userEvent.click(screen.getByTestId('menu-usuario'));
    await userEvent.click(screen.getByTestId('cerrar-sesion'));
    expect(await screen.findByRole('heading', { level: 1, name: /Aprende SQL/ })).toBeInTheDocument();
    expect(screen.getByTestId('toast')).toHaveTextContent('Cerraste sesión');
    expect(localStorage.getItem('consultaya.token')).toBeNull();
    expect(screen.queryByText('Inicia sesión para continuar')).not.toBeInTheDocument();
  });

  it('un 401 en cualquier servicio cierra la sesión y manda al login', async () => {
    const { servidor } = await import('../mocks/servidor');
    const { http, HttpResponse } = await import('msw');
    await conSesion();
    servidor.use(
      http.get('/api/progreso/resumen', () =>
        HttpResponse.json({ error: { codigo: 'NO_AUTENTICADO', mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.', campos: null } }, { status: 401 }),
      ),
    );
    renderApp('/progreso');
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(screen.getByTestId('toast')).toHaveTextContent('Tu sesión expiró');
    expect(localStorage.getItem('consultaya.token')).toBeNull();
  });
});

describe('Home', () => {
  it('muestra la landing sin píldora «Prototipo», sin panel demo y con el footer del curso', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: /Aprende SQL practicando/ })).toBeInTheDocument();
    expect(screen.queryByText('Prototipo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo/)).not.toBeInTheDocument();
    expect(screen.getByText('ConsultaYa · Proyecto del curso de Cloud Computing')).toBeInTheDocument();
    for (const t of ['Cómo funciona', 'Datasets', '¿Por qué ConsultaYa?', 'Precios']) expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    expect(screen.getByText('Bodega Doña Rosa')).toBeInTheDocument();
    expect(screen.getByText('S/ 24.90')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Crear cuenta gratis/ })[0]).toHaveAttribute('href', '/registro');
  });

  it('con sesión ofrece «Ir a mi panel»', async () => {
    await conSesion();
    renderApp('/');
    expect((await screen.findAllByRole('link', { name: /Ir a mi panel/ })).length).toBeGreaterThan(0);
  });

  it('una ruta desconocida muestra «No encontramos esta página»', async () => {
    renderApp('/no-existe');
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });
});
