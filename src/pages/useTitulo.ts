import { useEffect } from 'react';

/** Título de la pestaña: «<título> · ConsultaYa». */
export function useTitulo(titulo: string): void {
  useEffect(() => {
    document.title = `${titulo} · ConsultaYa`;
  }, [titulo]);
}
