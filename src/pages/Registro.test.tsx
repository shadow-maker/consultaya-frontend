import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

async function completar(nombres: string, email: string, password: string) {
  const u = userEvent.setup();
  if (nombres) await u.type(screen.getByTestId('registro-nombres'), nombres);
  if (email) await u.type(screen.getByTestId('registro-email'), email);
  if (password) await u.type(screen.getByTestId('registro-password'), password);
  await u.click(screen.getByTestId('registro-submit'));
}

describe('Registro (HU1)', () => {
  it('HU1-E1: registro correcto → toast de bienvenida y ruta de aprendizaje', async () => {
    renderApp('/registro');
    await completar('Luz Pérez', 'luz@ejemplo.pe', 'clave12345');
    expect(await screen.findByRole('heading', { name: /De cero a analista/ })).toBeInTheDocument();
    expect(screen.getByTestId('toast')).toHaveTextContent('¡Cuenta creada! Te damos la bienvenida, Luz.');
  });

  it('HU1-E2: correo ya registrado → «ya está en uso» con enlace a iniciar sesión', async () => {
    renderApp('/registro');
    await completar('Otra Ana', 'demo@consultaya.pe', 'clave12345');
    const error = await screen.findByTestId('form-error');
    expect(error).toHaveTextContent('Este correo ya está en uso. Si es tuyo, inicia sesión.');
    expect(screen.getByRole('link', { name: 'inicia sesión' })).toHaveAttribute('href', '/login');
  });

  it('valida en el cliente nombres, correo y contraseña', async () => {
    renderApp('/registro');
    await completar('', 'no-es-correo', '123');
    expect(await screen.findByText('Ingresa tus nombres.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByTestId('registro-email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('pinta bajo cada campo los errores 422 del servidor', async () => {
    const { servidor } = await import('../mocks/servidor');
    const { http, HttpResponse } = await import('msw');
    servidor.use(
      http.post('/api/usuarios/registro', () =>
        HttpResponse.json({ error: { codigo: 'VALIDACION', mensaje: 'Revisa los datos.', campos: { nombres: 'Los nombres no pueden superar los 120 caracteres.' } } }, { status: 422 }),
      ),
    );
    renderApp('/registro');
    await completar('Luz', 'luz@ejemplo.pe', 'clave12345');
    expect(await screen.findByText('Los nombres no pueden superar los 120 caracteres.')).toBeInTheDocument();
  });

  it('si el servidor no responde, muestra un mensaje claro', async () => {
    const { servidor } = await import('../mocks/servidor');
    const { http, HttpResponse } = await import('msw');
    servidor.use(http.post('/api/usuarios/registro', () => HttpResponse.error()));
    renderApp('/registro');
    await completar('Luz', 'luz@ejemplo.pe', 'clave12345');
    expect(await screen.findByTestId('form-error')).toHaveTextContent('No pudimos conectar con el servidor');
  });
});
