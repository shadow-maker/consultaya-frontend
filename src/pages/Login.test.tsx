import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

async function completar(email: string, password: string) {
  const u = userEvent.setup();
  if (email) await u.type(screen.getByTestId('login-email'), email);
  if (password) await u.type(screen.getByTestId('login-password'), password);
  await u.click(screen.getByTestId('login-submit'));
}

describe('Login (HU1)', () => {
  it('HU1-E3: con contraseña incorrecta muestra «Credenciales inválidas»', async () => {
    renderApp('/login');
    await completar('demo@consultaya.pe', 'incorrecta');
    const error = await screen.findByTestId('form-error');
    expect(error).toHaveTextContent('Credenciales inválidas');
    expect(error).toHaveTextContent('El correo o la contraseña no son correctos');
    expect(screen.getByTestId('login-password')).toHaveValue('');
  });

  it('valida en el cliente que haya correo y contraseña', async () => {
    renderApp('/login');
    await completar('', '');
    expect(await screen.findByTestId('form-error')).toHaveTextContent('Ingresa tu correo y tu contraseña.');
  });

  it('con credenciales correctas entra al panel y avisa con un toast', async () => {
    renderApp('/login');
    await completar('demo@consultaya.pe', 'demo1234');
    expect(await screen.findByRole('heading', { name: 'Tu panel de aprendizaje' })).toBeInTheDocument();
    expect(screen.getByTestId('toast')).toHaveTextContent('¡Hola de nuevo, Ana!');
    expect(localStorage.getItem('consultaya.token')).toBeTruthy();
  });

  it('tras iniciar sesión vuelve a la ruta que se quería abrir', async () => {
    renderApp({ pathname: '/login', state: { desde: '/progreso' } });
    await completar('demo@consultaya.pe', 'demo1234');
    expect(await screen.findByRole('heading', { name: 'Mi progreso' })).toBeInTheDocument();
  });

  it('muestra las cuentas de prueba solo en desarrollo', () => {
    renderApp('/login');
    expect(import.meta.env.DEV).toBe(true);
    expect(screen.getByTestId('cuentas-prueba')).toBeInTheDocument();
  });
});

describe('RequireAuth', () => {
  it('sin sesión, una ruta protegida manda al login con aviso', async () => {
    renderApp('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('toast')).toHaveTextContent('Inicia sesión para continuar'));
  });

  it('con un token guardado recupera la sesión desde /me', async () => {
    const u = userEvent.setup();
    const primero = renderApp('/login');
    await u.type(screen.getByTestId('login-email'), 'demo@consultaya.pe');
    await u.type(screen.getByTestId('login-password'), 'demo1234');
    await u.click(screen.getByTestId('login-submit'));
    await screen.findByRole('heading', { name: 'Tu panel de aprendizaje' });
    primero.unmount();

    renderApp('/progreso');
    expect(await screen.findByRole('heading', { name: 'Mi progreso' })).toBeInTheDocument();
  });

  it('un token inválido se descarta y se pide iniciar sesión', async () => {
    localStorage.setItem('consultaya.token', 'basura');
    renderApp('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(localStorage.getItem('consultaya.token')).toBeNull();
  });

  it('con sesión, login redirige al panel', async () => {
    const u = userEvent.setup();
    const primero = renderApp('/login');
    await u.type(screen.getByTestId('login-email'), 'demo@consultaya.pe');
    await u.type(screen.getByTestId('login-password'), 'demo1234');
    await u.click(screen.getByTestId('login-submit'));
    await screen.findByRole('heading', { name: 'Tu panel de aprendizaje' });
    primero.unmount();
    renderApp('/login');
    expect(await screen.findByRole('heading', { name: 'Tu panel de aprendizaje' })).toBeInTheDocument();
  });
});
