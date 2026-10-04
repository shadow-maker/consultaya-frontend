/** «Ana María Torres» → «Ana». */
export const primerNombre = (nombres: string): string => nombres.trim().split(/\s+/)[0] ?? '';

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** «Ejercicio 2» a partir de un id como `where-2`. */
export const numeroDeEjercicio = (ejercicioId: string): number => Number(ejercicioId.slice(ejercicioId.lastIndexOf('-') + 1));
