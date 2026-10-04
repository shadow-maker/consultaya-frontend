/** Subconjunto del contenido para los mocks (5 de las 8 lecciones, textos del prototipo en Markdown). */

export interface SeccionFixture {
  titulo: string;
  cuerpo_md: string;
  ejemplo?: { sql: string; nota?: string };
  tip?: string;
}

export interface EjercicioFixture {
  enunciado_md: string;
  solucion_sql: string;
  ordenado?: boolean;
}

export interface LeccionFixture {
  slug: string;
  modulo: string;
  dataset: string;
  duracion_min: number;
  tags: string[];
  titulo: string;
  resumen: string;
  aprenderas: string[];
  secciones: SeccionFixture[];
  ejercicios: EjercicioFixture[];
}

export const MODULOS_FIXTURE = [
  { slug: 'basico', nombre: 'Básico', orden: 1, descripcion: 'Lee y filtra datos de una tabla: SELECT, WHERE, ORDER BY y LIMIT.' },
  { slug: 'intermedio', nombre: 'Intermedio', orden: 2, descripcion: 'Combina condiciones y resume información con funciones de agregación y GROUP BY.' },
  { slug: 'avanzado', nombre: 'Avanzado', orden: 3, descripcion: 'Une tablas con JOIN y calcula métricas de negocio.' },
];

export const LECCIONES_FIXTURE: LeccionFixture[] = [
  {
    slug: 'select-from',
    modulo: 'basico',
    dataset: 'bodega',
    duracion_min: 10,
    tags: ['select', 'from', 'columnas', 'tabla'],
    titulo: 'Tu primera consulta: SELECT y FROM',
    resumen: 'Lee datos de una tabla eligiendo solo las columnas que necesitas.',
    aprenderas: ['Qué es una tabla: filas y columnas', 'Elegir columnas con SELECT', 'Indicar la tabla con FROM', 'Traer todas las columnas con *'],
    secciones: [
      {
        titulo: '¿Qué es una tabla?',
        cuerpo_md:
          'Una base de datos guarda la información en **tablas**, parecidas a una hoja de Excel. Cada **fila** es un registro (por ejemplo, un cliente) y cada **columna** es un dato de ese registro (su nombre, su distrito).\n\nEn esta lección usaremos los datos de la **Bodega Doña Rosa**, una bodega de Surquillo que registra sus productos, clientes y ventas.',
      },
      {
        titulo: 'Elegir columnas con SELECT … FROM',
        cuerpo_md:
          'Para leer datos escribimos `SELECT`, luego las columnas que queremos ver separadas por comas y, al final, `FROM` con el nombre de la tabla.',
        ejemplo: {
          sql: 'SELECT nombre, distrito\nFROM clientes;',
          nota: 'Pedimos solo dos columnas de la tabla clientes. Las columnas aparecen en el mismo orden en que las escribes.',
        },
      },
      {
        titulo: 'Todas las columnas con *',
        cuerpo_md: 'Si quieres ver todas las columnas, usa un asterisco (`*`). Es útil para explorar una tabla por primera vez.',
        ejemplo: { sql: 'SELECT *\nFROM clientes;' },
        tip: 'Las palabras clave como SELECT y FROM pueden ir en mayúsculas o minúsculas, pero en mayúsculas la consulta se lee mejor. El punto y coma final es opcional.',
      },
    ],
    ejercicios: [
      { enunciado_md: 'Muestra **todas las columnas** de la tabla `productos`.', solucion_sql: 'SELECT * FROM productos' },
      { enunciado_md: 'Muestra solo el **nombre** y el **precio** de cada producto, en ese orden.', solucion_sql: 'SELECT nombre, precio FROM productos' },
    ],
  },
  {
    slug: 'where',
    modulo: 'basico',
    dataset: 'bodega',
    duracion_min: 12,
    tags: ['where', 'filtrar', 'condicion', 'comparar'],
    titulo: 'Filtrar filas con WHERE',
    resumen: 'Quédate solo con las filas que cumplen una condición.',
    aprenderas: ['Filtrar filas con WHERE', 'Comparar números con >, <, >= y <=', 'Comparar textos entre comillas simples', 'Usar <> para decir “distinto de”'],
    secciones: [
      {
        titulo: 'La cláusula WHERE',
        cuerpo_md:
          'Muchas veces no necesitas todas las filas. `WHERE` va después de `FROM` e indica una condición: solo aparecen las filas donde la condición es verdadera.',
        ejemplo: {
          sql: "SELECT nombre, distrito\nFROM clientes\nWHERE distrito = 'Surquillo';",
          nota: 'Los textos van entre comillas simples y deben escribirse igual que en la tabla, respetando mayúsculas y tildes.',
        },
      },
      {
        titulo: 'Comparar números',
        cuerpo_md:
          "Con números puedes usar estos operadores:\n\n| Operador | Significa | Ejemplo |\n|---|---|---|\n| `=` | igual a | `stock = 0` |\n| `<>` | distinto de | `categoria <> 'Snacks'` |\n| `>` / `<` | mayor / menor que | `precio > 5` |\n| `>=` / `<=` | mayor / menor o igual | `precio <= 2` |",
        ejemplo: { sql: 'SELECT nombre, precio\nFROM productos\nWHERE precio >= 7;' },
      },
    ],
    ejercicios: [
      {
        enunciado_md: 'Muestra el **nombre** y el **precio** de los productos de la categoría **Bebidas**.',
        solucion_sql: "SELECT nombre, precio FROM productos WHERE categoria = 'Bebidas'",
      },
      {
        enunciado_md:
          'Doña Rosa quiere saber qué productos debe reponer. Muestra el **nombre** y el **stock** de los productos con **menos de 20 unidades**.',
        solucion_sql: 'SELECT nombre, stock FROM productos WHERE stock < 20',
      },
    ],
  },
  {
    slug: 'order-limit',
    modulo: 'basico',
    dataset: 'bodega',
    duracion_min: 10,
    tags: ['order by', 'limit', 'ordenar', 'asc', 'desc', 'ranking'],
    titulo: 'Ordenar y limitar resultados',
    resumen: 'Ordena tus resultados y quédate con los primeros: ideal para rankings.',
    aprenderas: ['Ordenar con ORDER BY', 'Elegir orden ascendente (ASC) o descendente (DESC)', 'Limitar la cantidad de filas con LIMIT'],
    secciones: [
      {
        titulo: 'Ordenar con ORDER BY',
        cuerpo_md:
          '`ORDER BY` ordena las filas según una columna. Por defecto el orden es ascendente (`ASC`): de menor a mayor o de la A a la Z. Con `DESC` el orden es descendente.',
        ejemplo: { sql: 'SELECT nombre, stock\nFROM productos\nORDER BY stock DESC;' },
      },
      {
        titulo: 'Limitar con LIMIT',
        cuerpo_md:
          '`LIMIT` va al final e indica cuántas filas quieres como máximo. Combinado con `ORDER BY` sirve para armar rankings: los más vendidos, los más baratos, etc.',
        ejemplo: { sql: 'SELECT nombre, precio\nFROM productos\nORDER BY precio\nLIMIT 3;', nota: 'Los 3 productos más baratos de la bodega.' },
        tip: 'Orden de las cláusulas: SELECT → FROM → WHERE → ORDER BY → LIMIT.',
      },
    ],
    ejercicios: [
      {
        enunciado_md: 'Muestra los **3 productos más caros** (nombre y precio), del más caro al más barato.',
        solucion_sql: 'SELECT nombre, precio FROM productos ORDER BY precio DESC LIMIT 3',
        ordenado: true,
      },
      {
        enunciado_md: 'Lista el **nombre** de todos los clientes en **orden alfabético**.',
        solucion_sql: 'SELECT nombre FROM clientes ORDER BY nombre',
        ordenado: true,
      },
    ],
  },
  {
    slug: 'group-by',
    modulo: 'intermedio',
    dataset: 'delivery',
    duracion_min: 15,
    tags: ['group by', 'having', 'agrupar', 'grupos'],
    titulo: 'Agrupar con GROUP BY y filtrar grupos con HAVING',
    resumen: 'Calcula un resumen por cada grupo: por distrito, por estado o por restaurante.',
    aprenderas: ['Agrupar filas con GROUP BY', 'La regla de las columnas agrupadas', 'Filtrar grupos con HAVING', 'Diferencia entre WHERE y HAVING'],
    secciones: [
      {
        titulo: 'GROUP BY',
        cuerpo_md:
          'Con `GROUP BY` calculas un resumen por cada grupo. Regla de oro: cada columna del `SELECT` debe estar en el `GROUP BY` o dentro de una función de agregación.',
        ejemplo: { sql: 'SELECT estado, COUNT(*) AS pedidos\nFROM pedidos\nGROUP BY estado;' },
      },
      {
        titulo: 'HAVING: filtrar grupos',
        cuerpo_md: '`WHERE` filtra filas *antes* de agrupar; `HAVING` filtra los grupos *después* de calcularlos.',
        ejemplo: {
          sql: 'SELECT restaurante_id, SUM(monto) AS total\nFROM pedidos\nGROUP BY restaurante_id\nHAVING SUM(monto) > 170;',
          nota: 'Solo los restaurantes cuyo total supera S/ 170.',
        },
      },
    ],
    ejercicios: [
      {
        enunciado_md: 'Muestra cada **distrito** con el **monto total** de sus pedidos **entregados**, ordenados del mayor al menor total.',
        solucion_sql: "SELECT distrito, SUM(monto) AS total FROM pedidos WHERE estado = 'entregado' GROUP BY distrito ORDER BY total DESC",
        ordenado: true,
      },
      {
        enunciado_md: 'Muestra los distritos que tienen **3 pedidos o más** (en cualquier estado), junto con su **cantidad de pedidos**.',
        solucion_sql: 'SELECT distrito, COUNT(*) FROM pedidos GROUP BY distrito HAVING COUNT(*) >= 3',
      },
    ],
  },
  {
    slug: 'join',
    modulo: 'avanzado',
    dataset: 'bodega',
    duracion_min: 15,
    tags: ['join', 'on', 'unir', 'tablas', 'alias'],
    titulo: 'Combinar tablas con JOIN',
    resumen: 'Une la información de varias tablas relacionadas por sus id.',
    aprenderas: ['Por qué los datos se reparten en varias tablas', 'Unir tablas con JOIN … ON', 'Usar alias cortos para las tablas', 'Agrupar después de unir'],
    secciones: [
      {
        titulo: '¿Por qué hay varias tablas?',
        cuerpo_md:
          'La tabla `ventas` no repite el nombre del producto ni del cliente: guarda sus **id** (`producto_id`, `cliente_id`). Así se evita duplicar información. Para ver los nombres hay que **unir** tablas.',
      },
      {
        titulo: 'JOIN … ON',
        cuerpo_md:
          '`JOIN` une dos tablas y `ON` indica qué columnas deben coincidir. Los alias cortos (`v`, `p`) ahorran escritura: `v.cantidad` significa “la columna cantidad de la tabla ventas”.',
        ejemplo: {
          sql: 'SELECT v.fecha, p.nombre, v.cantidad\nFROM ventas v\nJOIN productos p ON v.producto_id = p.id\nORDER BY v.fecha\nLIMIT 5;',
        },
        tip: 'Puedes agrupar después de unir: primero se combinan las filas y luego se resumen con GROUP BY.',
      },
    ],
    ejercicios: [
      {
        enunciado_md: 'Muestra el **nombre del cliente** y la **fecha** de cada venta.',
        solucion_sql: 'SELECT c.nombre, v.fecha FROM ventas v JOIN clientes c ON v.cliente_id = c.id',
      },
      {
        enunciado_md: 'Calcula cuántas **unidades** se vendieron de cada **categoría** de producto.',
        solucion_sql: 'SELECT p.categoria, SUM(v.cantidad) FROM ventas v JOIN productos p ON v.producto_id = p.id GROUP BY p.categoria',
      },
    ],
  },
];
