import bodegaSql from './bodega.sql?raw';
import campanasSql from './campanas.sql?raw';
import deliverySql from './delivery.sql?raw';

export interface DatasetFixture {
  slug: string;
  nombre: string;
  lugar: string;
  descripcion: string;
  icono: string;
  sql: string;
  tablas: { nombre: string; descripcion: string; columnas: { nombre: string; tipo: string }[] }[];
}

/** Datasets de los mocks. El archivo .sqlite se genera en el navegador ejecutando el .sql con sql.js. */
export const DATASETS_FIXTURE: DatasetFixture[] = [
  {
    slug: 'bodega',
    nombre: "Bodega Doña Rosa",
    lugar: "Surquillo, Lima",
    descripcion: "Productos, clientes y ventas diarias de una bodega de barrio.",
    icono: 'store',
    sql: bodegaSql,
    tablas: [
      {
        nombre: 'productos',
        descripcion: "Catálogo de productos con su precio (S/) y unidades en stock.",
        columnas: [{ nombre: 'id', tipo: 'INTEGER' }, { nombre: 'nombre', tipo: 'TEXT' }, { nombre: 'categoria', tipo: 'TEXT' }, { nombre: 'precio', tipo: 'DECIMAL' }, { nombre: 'stock', tipo: 'INTEGER' }],
      },
      {
        nombre: 'clientes',
        descripcion: "Clientes frecuentes de la bodega.",
        columnas: [{ nombre: 'id', tipo: 'INTEGER' }, { nombre: 'nombre', tipo: 'TEXT' }, { nombre: 'distrito', tipo: 'TEXT' }],
      },
      {
        nombre: 'ventas',
        descripcion: "Cada venta registra qué producto, a qué cliente, cuántas unidades y cuándo.",
        columnas: [{ nombre: 'id', tipo: 'INTEGER' }, { nombre: 'producto_id', tipo: 'INTEGER' }, { nombre: 'cliente_id', tipo: 'INTEGER' }, { nombre: 'cantidad', tipo: 'INTEGER' }, { nombre: 'fecha', tipo: 'DATE' }],
      },
    ],
  },
  {
    slug: 'delivery',
    nombre: "RapiMenú",
    lugar: "Lima Metropolitana",
    descripcion: "Pedidos de una app de delivery por distrito: montos, estados y fechas.",
    icono: 'bike',
    sql: deliverySql,
    tablas: [
      {
        nombre: 'restaurantes',
        descripcion: "Restaurantes afiliados a la app.",
        columnas: [{ nombre: 'id', tipo: 'INTEGER' }, { nombre: 'nombre', tipo: 'TEXT' }, { nombre: 'tipo_cocina', tipo: 'TEXT' }, { nombre: 'distrito', tipo: 'TEXT' }],
      },
      {
        nombre: 'pedidos',
        descripcion: "Cada pedido con el distrito de entrega, monto (S/), estado y fecha.",
        columnas: [{ nombre: 'id', tipo: 'INTEGER' }, { nombre: 'restaurante_id', tipo: 'INTEGER' }, { nombre: 'distrito', tipo: 'TEXT' }, { nombre: 'monto', tipo: 'DECIMAL' }, { nombre: 'estado', tipo: 'TEXT' }, { nombre: 'fecha', tipo: 'DATE' }],
      },
    ],
  },
  {
    slug: 'campanas',
    nombre: "Campañas de TiendaNova",
    lugar: "Tienda online",
    descripcion: "Presupuesto, clics y conversiones de campañas de marketing digital.",
    icono: 'megaphone',
    sql: campanasSql,
    tablas: [
      {
        nombre: 'campanas',
        descripcion: "Una fila por campaña. Presupuesto en soles; conversiones = ventas logradas.",
        columnas: [{ nombre: 'id', tipo: 'INTEGER' }, { nombre: 'nombre', tipo: 'TEXT' }, { nombre: 'canal', tipo: 'TEXT' }, { nombre: 'presupuesto', tipo: 'DECIMAL' }, { nombre: 'clics', tipo: 'INTEGER' }, { nombre: 'conversiones', tipo: 'INTEGER' }, { nombre: 'mes', tipo: 'TEXT' }],
      },
    ],
  },
];
