import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../mocks/servidor';
import { conSesion, renderApp } from '../test/render';

const textarea = () => within(screen.getByTestId('editor')).getByRole('textbox') as HTMLTextAreaElement;
const escribir = (sql: string) => fireEvent.change(textarea(), { target: { value: sql } });

async function abrir(id: string, usuario: 'demo@consultaya.pe' | 'nuevo@consultaya.pe' = 'nuevo@consultaya.pe') {
  await conSesion(usuario);
  renderApp(`/ejercicio/${id}`);
  // Espera a que carguen el ejercicio y los datos del dataset (el botón se habilita cuando hay archivo).
  await waitFor(() => expect(screen.getByTestId('ejecutar')).toBeEnabled(), { timeout: 5000 });
}

const SOL_WHERE_1 = "SELECT nombre, precio FROM productos WHERE categoria = 'Bebidas'";

describe('Ejercicio (HU4)', () => {
  it('muestra enunciado, tablas del dataset y pestañas; «Enviar» está deshabilitado antes de ejecutar', async () => {
    await abrir('where-1');
    expect(screen.getByTestId('enunciado')).toHaveTextContent('Muestra el nombre y el precio de los productos de la categoría Bebidas.');
    expect(screen.getByText('productos')).toBeInTheDocument();
    expect(screen.getByTestId('ex-tab-where-1')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('ex-tab-where-2')).toBeInTheDocument();
    expect(screen.getByTestId('enviar')).toBeDisabled();
    expect(textarea()).toHaveValue('-- Escribe tu consulta aquí\n');
  });

  it('«Pedir pista» está deshabilitado con la etiqueta «Próximamente»', async () => {
    await abrir('where-1');
    const pista = screen.getByRole('button', { name: /Pedir pista/ });
    expect(pista).toBeDisabled();
    expect(pista).toHaveTextContent('Próximamente');
  });

  it('HU4-E1: ejecutar muestra la tabla de resultados y habilita «Enviar»', async () => {
    await abrir('where-1');
    escribir(SOL_WHERE_1);
    await userEvent.click(screen.getByTestId('ejecutar'));
    const res = await screen.findByTestId('resultado');
    expect(res).toHaveTextContent('3 filas · 2 columnas');
    expect(res).toHaveTextContent('Inca Kola 500 ml');
    expect(screen.getByTestId('enviar')).toBeEnabled();
  });

  it('Ctrl+Enter ejecuta la consulta', async () => {
    await abrir('where-1');
    escribir('SELECT 1 AS uno');
    fireEvent.keyDown(textarea(), { key: 'Enter', ctrlKey: true });
    expect(await screen.findByTestId('resultado')).toHaveTextContent('1 fila · 1 columna');
  });

  it('HU4-E2: respuesta correcta → feedback, ejercicio completado en la pestaña y en el avance', async () => {
    await abrir('where-1');
    escribir(SOL_WHERE_1);
    await userEvent.click(screen.getByTestId('ejecutar'));
    await userEvent.click(await screen.findByTestId('enviar'));
    const ok = await screen.findByTestId('feedback-ok');
    expect(ok).toHaveTextContent('¡Respuesta correcta!');
    expect(ok).toHaveTextContent('El ejercicio se marcó como completado.');
    await waitFor(() => expect(screen.getByTestId('ex-tab-where-1')).toHaveAttribute('data-estado', 'completado'));
    expect(screen.getByTestId('siguiente')).toHaveTextContent('Siguiente ejercicio');
    expect(await screen.findByTestId('ejercicio-completado')).toBeInTheDocument();
  });

  it('enviar de nuevo un ejercicio ya completado dice «buen repaso»', async () => {
    await abrir('where-1', 'demo@consultaya.pe');
    escribir(SOL_WHERE_1);
    await userEvent.click(screen.getByTestId('ejecutar'));
    await userEvent.click(await screen.findByTestId('enviar'));
    expect(await screen.findByTestId('feedback-ok')).toHaveTextContent('Ya lo tenías completado: ¡buen repaso!');
  });

  it('el último ejercicio de una lección ofrece la siguiente lección', async () => {
    await abrir('where-2');
    escribir('SELECT nombre, stock FROM productos WHERE stock < 20');
    await userEvent.click(screen.getByTestId('ejecutar'));
    await userEvent.click(await screen.findByTestId('enviar'));
    await screen.findByTestId('feedback-ok');
    expect(screen.getByTestId('siguiente')).toHaveTextContent('Siguiente lección: Ordenar y limitar resultados');
  });

  it('HU4-E3: respuesta incorrecta → explica la diferencia y el editor sigue editable', async () => {
    await abrir('where-1');
    escribir("SELECT nombre, precio FROM productos WHERE categoria = 'Snacks'");
    await userEvent.click(screen.getByTestId('ejecutar'));
    await userEvent.click(await screen.findByTestId('enviar'));
    const err = await screen.findByTestId('feedback-error');
    expect(err).toHaveTextContent('Todavía no es correcto');
    expect(err).toHaveTextContent('Tu consulta devuelve 2 filas, pero se esperaban 3 filas.');
    expect(err).toHaveTextContent('Edita tu consulta y vuelve a intentarlo.');
    expect(screen.getByTestId('resultado')).toBeInTheDocument();
    expect(textarea()).toBeEnabled();
    expect(textarea()).not.toHaveAttribute('readonly');
    expect(screen.queryByTestId('feedback-ok')).not.toBeInTheDocument();
  });

  it('HU4-E4: error de sintaxis explicado en español', async () => {
    await abrir('where-1');
    escribir('SELEC * FROM productos');
    await userEvent.click(screen.getByTestId('ejecutar'));
    const e = await screen.findByTestId('sql-error');
    expect(e).toHaveTextContent('Error de sintaxis');
    expect(e).toHaveTextContent('¿Quisiste decir SELECT?');
    expect(screen.getByTestId('enviar')).toBeEnabled(); // ejecutó (con error): ya puede enviar
  });

  it('error de SQLite traducido, con sugerencias del esquema', async () => {
    await abrir('where-1');
    escribir('SELECT nombre FROM producto');
    await userEvent.click(screen.getByTestId('ejecutar'));
    const e = await screen.findByTestId('sql-error');
    expect(e).toHaveTextContent('Tabla no encontrada');
    expect(e).toHaveTextContent('¿Quisiste decir «productos»?');
  });

  it('HU4-E5: DML se bloquea con aviso de solo lectura', async () => {
    await abrir('where-1');
    escribir('DELETE FROM productos');
    await userEvent.click(screen.getByTestId('ejecutar'));
    const e = await screen.findByTestId('sql-error');
    expect(e).toHaveTextContent('Solo se permiten consultas SELECT');
    expect(e).toHaveClass('warn');
  });

  it('enviar con un error de SQL muestra el error (no compara)', async () => {
    await abrir('where-1');
    escribir('SELECT 1');
    await userEvent.click(screen.getByTestId('ejecutar'));
    await screen.findByTestId('resultado');
    escribir('SELECT nombre FROM');
    await userEvent.click(screen.getByTestId('enviar'));
    expect(await screen.findByTestId('sql-error')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-error')).not.toBeInTheDocument();
  });

  it('si falla el guardado muestra el resultado correcto y avisa que no se guardó', async () => {
    servidor.use(
      http.post('/api/progreso/ejercicios/:id/completar', () =>
        HttpResponse.json({ error: { codigo: 'SERVICIO_NO_DISPONIBLE', mensaje: 'x', campos: null } }, { status: 503 }),
      ),
    );
    await abrir('where-1');
    escribir(SOL_WHERE_1);
    await userEvent.click(screen.getByTestId('ejecutar'));
    await userEvent.click(await screen.findByTestId('enviar'));
    expect(await screen.findByTestId('feedback-ok')).toHaveTextContent('¡Respuesta correcta!');
    expect(screen.getByTestId('error-guardar')).toHaveTextContent('No pudimos guardar tu avance. Intenta enviar de nuevo.');
    expect(screen.queryByTestId('siguiente')).not.toBeInTheDocument();
  });

  it('guarda el borrador por usuario y ejercicio, y lo recupera', async () => {
    await abrir('where-1');
    escribir('SELECT 42');
    const claves = Object.keys(Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!).reduce((a, k) => ({ ...a, [k]: 1 }), {}));
    const clave = claves.find((k) => k.startsWith('consultaya.borrador.') && k.endsWith('.where-1'));
    expect(clave).toBeDefined();
    expect(localStorage.getItem(clave!)).toBe('SELECT 42');
  });

  it('restablecer vuelve al texto inicial', async () => {
    await abrir('where-1');
    escribir('SELECT 42');
    await userEvent.click(screen.getByRole('button', { name: 'Restablecer el editor' }));
    expect(textarea()).toHaveValue('-- Escribe tu consulta aquí\n');
  });

  it('clic en una columna del esquema la inserta en el editor', async () => {
    await abrir('where-1');
    escribir('SELECT ');
    textarea().setSelectionRange(7, 7);
    await userEvent.click(screen.getAllByRole('button', { name: /^precio/ })[0]);
    expect(textarea().value).toBe('SELECT precio');
  });

  it('un ejercicio inexistente muestra «No encontramos esta página»', async () => {
    await conSesion();
    renderApp('/ejercicio/no-existe-9');
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument();
  });
});
