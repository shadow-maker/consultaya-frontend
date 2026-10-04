const CLAVE = 'consultaya.token';

/** El token vive en localStorage; si el navegador lo bloquea, la sesión dura solo mientras la pestaña esté abierta. */
let enMemoria: string | null = null;

export function leerToken(): string | null {
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    return enMemoria;
  }
}

export function guardarToken(token: string): void {
  enMemoria = token;
  try {
    window.localStorage.setItem(CLAVE, token);
  } catch {
    /* sin localStorage */
  }
}

export function borrarToken(): void {
  enMemoria = null;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    /* sin localStorage */
  }
}
