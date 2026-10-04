import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { hl } from '../sql/formato';

export interface EditorApi {
  /** Inserta texto en la posición del cursor (clic en una columna del esquema). */
  insertar: (texto: string) => void;
  enfocar: () => void;
}

interface Props {
  valor: string;
  onCambio: (valor: string) => void;
  /** Ctrl/Cmd + Enter. */
  onEjecutar?: () => void;
  api?: Ref<EditorApi>;
  ariaLabel?: string;
}

/** Editor SQL: un `<textarea>` transparente sobre un `<pre>` con el SQL resaltado. Tab inserta 2 espacios. */
export function EditorSql({ valor, onCambio, onEjecutar, api, ariaLabel = 'Editor SQL' }: Props) {
  const area = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLPreElement>(null);

  const sincronizarScroll = () => {
    if (pre.current && area.current) {
      pre.current.scrollTop = area.current.scrollTop;
      pre.current.scrollLeft = area.current.scrollLeft;
    }
  };
  useEffect(sincronizarScroll, [valor]);

  useImperativeHandle(api, () => ({
    insertar(texto) {
      const ta = area.current;
      if (!ta) return;
      ta.focus();
      ta.setRangeText(texto, ta.selectionStart, ta.selectionEnd, 'end');
      onCambio(ta.value);
    },
    enfocar: () => area.current?.focus(),
  }));

  return (
    <div className="editor" data-testid="editor">
      <pre ref={pre} aria-hidden="true">
        <code dangerouslySetInnerHTML={{ __html: hl(valor) + '\n ' }} />
      </pre>
      <textarea
        ref={area}
        value={valor}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label={ariaLabel}
        onChange={(e) => onCambio(e.target.value)}
        onScroll={sincronizarScroll}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onEjecutar?.();
          } else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.setRangeText('  ', e.currentTarget.selectionStart, e.currentTarget.selectionEnd, 'end');
            onCambio(e.currentTarget.value);
          }
        }}
      />
    </div>
  );
}
