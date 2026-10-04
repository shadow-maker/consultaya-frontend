import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

async function arrancar() {
  // Mocks de MSW: solo en `npm run dev` con VITE_API_MOCKS=true. En el build de producción esta rama desaparece.
  if (import.meta.env.DEV && import.meta.env.VITE_API_MOCKS === 'true') {
    const { iniciarMocks } = await import('./mocks/navegador');
    await iniciarMocks();
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void arrancar();
