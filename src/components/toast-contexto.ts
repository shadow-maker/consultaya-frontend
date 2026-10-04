import { createContext, useContext } from 'react';

export interface ToastApi {
  /** Muestra un aviso breve (≈ 2,8 s). */
  mostrar: (mensaje: string) => void;
}

export const ToastContexto = createContext<ToastApi>({ mostrar: () => {} });

export const useToast = () => useContext(ToastContexto);
