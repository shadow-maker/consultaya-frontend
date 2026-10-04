import { cargarSqlJs } from '../sql/engine';
import type { Esquema } from '../sql/tipos';

/** Dataset pequeño (bodega) creado en memoria para los tests de `src/sql/`. */
export const ESQUEMA_PRUEBA: Esquema = [
  { nombre: 'productos', columnas: ['id', 'nombre', 'categoria', 'precio', 'stock'] },
  { nombre: 'clientes', columnas: ['id', 'nombre', 'distrito'] },
  { nombre: 'ventas', columnas: ['id', 'producto_id', 'cliente_id', 'cantidad', 'fecha'] },
];

export const SQL_PRUEBA = `
CREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, categoria TEXT NOT NULL, precio REAL NOT NULL, stock INTEGER NOT NULL);
INSERT INTO productos VALUES (1, 'Inca Kola 500 ml', 'Bebidas', 3.50, 48);
INSERT INTO productos VALUES (2, 'Coca-Cola 1.5 L', 'Bebidas', 7.00, 24);
INSERT INTO productos VALUES (3, 'Arroz Costeño 1 kg', 'Abarrotes', 4.80, 35);
INSERT INTO productos VALUES (4, 'Papitas Lay''s', 'Snacks', 2.50, 30);
CREATE TABLE clientes (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, distrito TEXT NOT NULL);
INSERT INTO clientes VALUES (1, 'Lucía Quispe', 'Surquillo');
INSERT INTO clientes VALUES (2, 'Jorge Huamán', 'Miraflores');
CREATE TABLE ventas (id INTEGER PRIMARY KEY, producto_id INTEGER, cliente_id INTEGER, cantidad INTEGER, fecha TEXT);
INSERT INTO ventas VALUES (1, 1, 1, 2, '2026-09-01');
INSERT INTO ventas VALUES (2, 3, 2, 1, '2026-09-02');
`;

/** Bytes de un archivo .sqlite con el dataset de prueba. */
export async function crearDatasetPrueba(): Promise<Uint8Array> {
  const SQL = await cargarSqlJs();
  const db = new SQL.Database();
  db.run(SQL_PRUEBA);
  const bytes = db.export();
  db.close();
  return bytes;
}
