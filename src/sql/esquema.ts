import type { Esquema } from './tipos';

interface TablaConColumnas {
  nombre: string;
  columnas: { nombre: string }[];
}

/** Esquema para las sugerencias de error, a partir de las tablas que devuelve la API del dataset. */
export const esquemaDeTablas = (tablas: TablaConColumnas[]): Esquema =>
  tablas.map((t) => ({ nombre: t.nombre, columnas: t.columnas.map((c) => c.nombre) }));
