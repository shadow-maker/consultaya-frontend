import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Servidor MSW para los tests (vitest). */
export const servidor = setupServer(...handlers);
