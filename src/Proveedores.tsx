import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './components/ToastProvider';
import { crearQueryClient } from './query-client';

/** Toast, TanStack Query y sesión. Va dentro del router (la sesión navega). */
export function Proveedores({ children, cliente }: { children: ReactNode; cliente?: QueryClient }) {
  const [porDefecto] = useState(crearQueryClient);
  return (
    <ToastProvider>
      <QueryClientProvider client={cliente ?? porDefecto}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}
