import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EditorSql, type EditorApi } from './EditorSql';

const css = readFileSync(resolve(process.cwd(), 'src/styles/codigo.css'), 'utf8');
const regla = (selector: string) => {
  const inicio = css.indexOf(selector + '{');
  expect(inicio, `falta la regla ${selector}`).toBeGreaterThanOrEqual(0);
  return css.slice(inicio, css.indexOf('}', inicio));
};

describe('EditorSql: capas alineadas', () => {
  it('el <pre> de resaltado y el <textarea> comparten las mismas métricas de texto (CSS)', () => {
    const compartida = regla('.editor pre, .editor textarea');
    for (const propiedad of ['position:absolute', 'padding:', 'font:', 'letter-spacing:', 'white-space:pre', 'tab-size:', 'border:0', 'margin:0']) {
      expect(compartida).toContain(propiedad);
    }
  });

  it('el <code> de la capa de resaltado no hereda el estilo global de `code` (fondo, padding, tamaño)', () => {
    // Regresión: `code{font-size:.88em; background:...; padding:1px 5px}` pintaba un fondo por línea y desalineaba el caret.
    const code = regla('.editor pre code');
    for (const propiedad of ['background:none', 'padding:0', 'font:inherit', 'letter-spacing:inherit', 'line-height:inherit']) {
      expect(code).toContain(propiedad);
    }
  });

  it('renderiza el textarea dentro de data-testid=editor y la capa de resaltado oculta a lectores de pantalla', () => {
    render(<EditorSql valor={"SELECT 'a'\nFROM t"} onCambio={() => {}} />);
    const editor = screen.getByTestId('editor');
    expect(within(editor).getByRole('textbox')).toHaveValue("SELECT 'a'\nFROM t");
    const pre = editor.querySelector('pre')!;
    expect(pre).toHaveAttribute('aria-hidden', 'true');
    expect(pre.textContent).toBe("SELECT 'a'\nFROM t\n ");
  });
});

describe('EditorSql: comportamiento', () => {
  it('Tab inserta 2 espacios y Ctrl+Enter ejecuta', () => {
    const onCambio = vi.fn();
    const onEjecutar = vi.fn();
    render(<EditorSql valor="a" onCambio={onCambio} onEjecutar={onEjecutar} />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    ta.setSelectionRange(1, 1);
    fireEvent.keyDown(ta, { key: 'Tab' });
    expect(onCambio).toHaveBeenCalledWith('a  ');
    fireEvent.keyDown(ta, { key: 'Enter', ctrlKey: true });
    expect(onEjecutar).toHaveBeenCalledTimes(1);
  });

  it('insertar() pone el texto en la posición del cursor', () => {
    const onCambio = vi.fn();
    const api = createRef<EditorApi>();
    render(<EditorSql valor="SELECT  FROM t" onCambio={onCambio} api={api} />);
    (screen.getByRole('textbox') as HTMLTextAreaElement).setSelectionRange(7, 7);
    api.current!.insertar('nombre');
    expect(onCambio).toHaveBeenCalledWith('SELECT nombre FROM t');
  });
});
