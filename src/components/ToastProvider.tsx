import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { ToastContexto } from './toast-contexto';

const DURACION_MS = 2800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ id: number; mensaje: string } | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const contador = useRef(0);

  const mostrar = useCallback((mensaje: string) => {
    clearTimeout(temporizador.current);
    contador.current += 1;
    setAviso({ id: contador.current, mensaje });
    temporizador.current = setTimeout(() => setAviso(null), DURACION_MS);
  }, []);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContexto.Provider value={valor}>
      {children}
      <div role="status" aria-live="polite">
        {aviso && (
          <div className="toast" data-testid="toast" key={aviso.id}>
            <Icon name="check" />
            <span>{aviso.mensaje}</span>
          </div>
        )}
      </div>
    </ToastContexto.Provider>
  );
}
