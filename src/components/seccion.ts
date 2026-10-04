/** Sección activa del menú principal según la ruta. */
export function seccionActiva(pathname: string): string {
  if (/^\/(ruta|leccion|ejercicio)(\/|$)/.test(pathname)) return 'ruta';
  const m = /^\/(dashboard|progreso|playground)(\/|$)/.exec(pathname);
  return m ? m[1] : '';
}
