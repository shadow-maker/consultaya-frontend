import { setupWorker } from 'msw/browser';
import { config, handlers } from './handlers';
import { activarPersistencia } from './estado';

/** Arranca MSW en el navegador. Solo se importa en desarrollo con `VITE_API_MOCKS=true`. */
export async function iniciarMocks(): Promise<void> {
  activarPersistencia();
  config.retrasoMs = 150;
  await setupWorker(...handlers).start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: true,
  });
  console.info('[ConsultaYa] API simulada con MSW (VITE_API_MOCKS=true). Cuentas: demo@consultaya.pe / demo1234 y nuevo@consultaya.pe / nuevo1234.');
}
