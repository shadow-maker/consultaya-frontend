import { api } from './cliente';
import type { LoginPeticion, RegistroPeticion, Sesion, Usuario } from './tipos';

export const registrar = (datos: RegistroPeticion) =>
  api<Sesion>('/api/usuarios/registro', { metodo: 'POST', cuerpo: datos, auth: false });

export const iniciarSesionApi = (datos: LoginPeticion) =>
  api<Sesion>('/api/usuarios/login', { metodo: 'POST', cuerpo: datos, auth: false });

export const obtenerPerfil = () => api<Usuario>('/api/usuarios/me');

export const actualizarPerfil = (datos: { nombres: string }) =>
  api<Usuario>('/api/usuarios/me', { metodo: 'PATCH', cuerpo: datos });
