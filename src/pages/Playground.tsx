import { useRef, useState } from 'react';
import { useArchivoDataset, useDataset } from '../api/hooks';
import { useAuth } from '../auth/auth-contexto';
import { Cargando, ErrorCarga } from '../components/Carga';
import { EditorSql, type EditorApi } from '../components/EditorSql';
import { ErrorSql } from '../components/ErrorSql';
import { Esquema } from '../components/Esquema';
import { Icon, type NombreIcono } from '../components/Icon';
import { BloqueResultado } from '../components/TablaResultado';
import { ejecutar } from '../sql/engine';
import { esquemaDeTablas } from '../sql/esquema';
import type { Dataset } from '../api/tipos';
import type { ErrorSql as ErrorSqlTipo, ResultadoEjecucion } from '../sql/tipos';
import { useTitulo } from './useTitulo';

const DATASETS: { slug: string; nombre: string; icono: NombreIcono }[] = [
  { slug: 'bodega', nombre: 'Bodega Doña Rosa', icono: 'store' },
  { slug: 'delivery', nombre: 'RapiMenú', icono: 'bike' },
  { slug: 'campanas', nombre: 'Campañas de TiendaNova', icono: 'megaphone' },
];

const EJEMPLOS: Record<string, string> = {
  bodega: 'SELECT categoria, COUNT(*) AS productos\nFROM productos\nGROUP BY categoria\nORDER BY productos DESC;',
  delivery: 'SELECT *\nFROM pedidos\nLIMIT 5;',
  campanas: 'SELECT canal, SUM(presupuesto) AS inversion\nFROM campanas\nGROUP BY canal\nORDER BY inversion DESC;',
};

const clave = (usuarioId: string, slug: string) => `consultaya.playground.${usuarioId}.${slug}`;
const CLAVE_DATASET = 'consultaya.playground.dataset';

function leer(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}
function guardar(k: string, v: string) {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* sin localStorage */
  }
}

type Salida = null | { tipo: 'resultado'; resultado: ResultadoEjecucion } | { tipo: 'error'; error: ErrorSqlTipo };

/** Consola de un dataset. Se remonta (`key`) al cambiar de dataset. */
function Consola({ dataset, usuarioId, bytes }: { dataset: Dataset; usuarioId: string; bytes: Uint8Array | undefined }) {
  const editor = useRef<EditorApi>(null);
  const k = clave(usuarioId, dataset.slug);
  const [sql, setSql] = useState(() => leer(k) ?? EJEMPLOS[dataset.slug] ?? 'SELECT 1;');
  const [salida, setSalida] = useState<Salida>(null);
  const [trabajando, setTrabajando] = useState(false);

  async function correr() {
    if (!bytes) return;
    setTrabajando(true);
    try {
      const r = await ejecutar(bytes, sql, esquemaDeTablas(dataset.tablas));
      setSalida(r.ok ? { tipo: 'resultado', resultado: r.resultado } : { tipo: 'error', error: r.error });
    } finally {
      setTrabajando(false);
    }
  }
  const cambiar = (v: string) => {
    setSql(v);
    guardar(k, v);
  };

  return (
    <div className="pg-layout">
      <section className="card">
        <h3>Tablas</h3>
        <p className="muted small" style={{ margin: '-4px 0 0' }}>
          {dataset.descripcion}
        </p>
        <Esquema tablas={dataset.tablas} onColumna={(c) => editor.current?.insertar(c)} />
      </section>
      <section className="card">
        <div className="editor-head">
          <b>Consola SQL</b>
          <span className="muted small">
            Solo consultas SELECT · <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> para ejecutar
          </span>
        </div>
        <EditorSql valor={sql} onCambio={cambiar} onEjecutar={() => void correr()} api={editor} />
        <div className="toolbar">
          <button className="btn primary" type="button" data-testid="ejecutar" disabled={!bytes || trabajando} onClick={() => void correr()}>
            <Icon name="play" /> Ejecutar
          </button>
          <button className="btn ghost sm" type="button" style={{ marginLeft: 'auto' }} onClick={() => cambiar(EJEMPLOS[dataset.slug] ?? '')}>
            <Icon name="reset" /> Ejemplo
          </button>
        </div>
        <div>
          {!salida && (
            <div className="out-empty">
              <Icon name="table" />
              <p>El resultado aparecerá aquí.</p>
            </div>
          )}
          {salida?.tipo === 'resultado' && <BloqueResultado resultado={salida.resultado} truncado={salida.resultado.truncado} />}
          {salida?.tipo === 'error' && <ErrorSql error={salida.error} />}
        </div>
      </section>
    </div>
  );
}

export default function Playground() {
  useTitulo('Modo libre');
  const { usuario } = useAuth();
  const [slug, setSlug] = useState(() => {
    const guardado = leer(CLAVE_DATASET);
    return DATASETS.some((d) => d.slug === guardado) ? (guardado as string) : 'bodega';
  });
  const dataset = useDataset(slug);
  const archivo = useArchivoDataset(dataset.data);

  const elegir = (s: string) => {
    setSlug(s);
    guardar(CLAVE_DATASET, s);
  };

  return (
    <div className="wrap page">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            Modo libre <span className="chip st-pendiente">Vista previa</span>
          </p>
          <h1>Practica sin ejercicio asignado</h1>
          <p className="muted">
            Elige un dataset y escribe cualquier consulta SELECT para explorar los datos. En el producto final será parte del plan Pro.
          </p>
        </div>
      </div>
      <div className="seg" role="tablist" aria-label="Datasets">
        {DATASETS.map((d) => (
          <button key={d.slug} type="button" role="tab" aria-selected={d.slug === slug} className={d.slug === slug ? 'on' : ''} onClick={() => elegir(d.slug)}>
            <Icon name={d.icono} /> {d.nombre}
          </button>
        ))}
      </div>
      {dataset.isError ? (
        <ErrorCarga error={dataset.error} onReintentar={() => void dataset.refetch()} />
      ) : !dataset.data || !usuario ? (
        <Cargando />
      ) : (
        <Consola key={dataset.data.slug} dataset={dataset.data} usuarioId={usuario.id} bytes={archivo.data} />
      )}
    </div>
  );
}
