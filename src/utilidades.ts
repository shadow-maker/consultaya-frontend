/** «Ana María Torres» → «Ana». */
export const primerNombre = (nombres: string): string => nombres.trim().split(/\s+/)[0] ?? '';

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
