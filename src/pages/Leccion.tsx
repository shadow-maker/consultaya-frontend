import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/cliente';
import { claves, useDataset, useLeccion, useResumen } from '../api/hooks';
import { registrarVisita } from '../api/progreso';
import type { EjemploSeccion } from '../api/tipos';
import { Cargando, ErrorCarga } from '../components/Carga';
import { CodigoSql } from '../components/CodigoSql';
import { PuntoEstado } from '../components/Estado';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { TablaResultado } from '../components/TablaResultado';
import { plural } from '../sql/comparar';
import { numeroDeEjercicio } from '../utilidades';
import NotFound from './NotFound';
import { useTitulo } from './useTitulo';

function Ejemplo({ ejemplo }: { ejemplo: EjemploSeccion }) {
  return (
    <div className="example" data-testid="ejemplo">
      <div className="ex-head">
        <Icon name="terminal" /> Ejemplo <span className="muted">· consulta y resultado</span>
      </div>
      <CodigoSql sql={ejemplo.sql} />
      <div className="ex-res">
        <TablaResultado resultado={ejemplo.resultado} testId="ejemplo-resultado" />
        <p className="muted small" style={{ margin: '6px 2px 0' }}>
          {plural(ejemplo.resultado.filas.length, 'fila')}
        </p>
      </div>
      {ejemplo.nota && <p className="ex-note">{ejemplo.nota}</p>}
    </div>
  );
}

export default function Leccion() {
  const { slug } = useParams();
  const leccion = useLeccion(slug);
  const dataset = useDataset(leccion.data?.dataset);
  const resumen = useResumen();
  const queries = useQueryClient();
  useTitulo(leccion.data?.titulo ?? 'Lección');

  // Abrir la lección la deja «en curso» (idempotente). Si falla no se avisa: no bloquea la lectura.
  const existe = !!leccion.data;
  useEffect(() => {
    if (!slug || !existe) return;
    let activo = true;
    registrarVisita(slug)
      .then(() => {
        if (activo) void queries.invalidateQueries({ queryKey: claves.progreso });
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [slug, existe, queries]);

  if (leccion.error instanceof ApiError && leccion.error.codigo === 'LECCION_NO_EXISTE') return <NotFound />;
  if (leccion.isError) return <ErrorCarga error={leccion.error} onReintentar={() => void leccion.refetch()} />;
  if (!leccion.data) return <Cargando />;

  const l = leccion.data;
  const hechos = new Set(resumen.data?.ejercicios_completados.map((e) => e.ejercicio_id));
  const ds = dataset.data;
  const primero = l.ejercicios[0];

  return (
    <div className="wrap page">
      <div className="crumbs">
        <Link to="/ruta">Ruta</Link>
        <span>/</span>
        <Link to={`/ruta/${l.slug}`}>{l.titulo}</Link>
        <span>/</span>Lección
      </div>
      <div className="lesson-layout">
        <article className="card lesson-body">
          <p className="eyebrow">
            Lección {l.orden} · Módulo {l.modulo.nombre}
          </p>
          <h1>{l.titulo}</h1>
          <p className="lead-sm">{l.resumen}</p>

          {l.secciones.map((s) => (
            <section className="lsec" key={s.orden} data-testid="seccion">
              <h2>
                <span className="sec-n">{s.orden}</span>
                {s.titulo}
              </h2>
              <Markdown>{s.cuerpo_md}</Markdown>
              {s.ejemplo && <Ejemplo ejemplo={s.ejemplo} />}
              {s.tip && (
                <div className="tip">
                  <Icon name="bulb" />
                  <div>{s.tip}</div>
                </div>
              )}
            </section>
          ))}

          <div className="lesson-cta">
            <div>
              <h3>¿Listo para practicar?</h3>
              <p className="muted">Esta lección tiene {plural(l.ejercicios.length, 'ejercicio')} con validación automática.</p>
            </div>
            {primero && (
              <Link className="btn primary lg" to={`/ejercicio/${primero.id}`} data-testid="ir-ejercicios">
                Ir a los ejercicios <Icon name="arrow" />
              </Link>
            )}
          </div>
        </article>

        <aside className="lesson-aside">
          <div className="card">
            <h3>
              <Icon name="db" /> Dataset
            </h3>
            {ds ? (
              <>
                <p style={{ margin: 0 }}>
                  <b>{ds.nombre}</b>
                </p>
                <p className="muted small">
                  {ds.lugar} · {ds.descripcion}
                </p>
                <ul className="mini-tables">
                  {ds.tablas.map((t) => (
                    <li key={t.nombre}>
                      <code style={{ justifySelf: 'start' }}>{t.nombre}</code>
                      <span className="muted small">{t.columnas.map((c) => c.nombre).join(', ')}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted small">Cargando…</p>
            )}
          </div>
          <div className="card">
            <h3>Ejercicios</h3>
            <ul className="ex-list">
              {l.ejercicios.map((e) => (
                <li key={e.id}>
                  <Link to={`/ejercicio/${e.id}`}>
                    <PuntoEstado estado={hechos.has(e.id) ? 'completada' : 'pendiente'} />
                    <span>Ejercicio {numeroDeEjercicio(e.id)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lesson-nav">
            {l.anterior ? (
              <Link className="btn sm" to={`/leccion/${l.anterior}`}>
                <Icon name="back" /> Anterior
              </Link>
            ) : (
              <span></span>
            )}
            {l.siguiente && (
              <Link className="btn sm" to={`/leccion/${l.siguiente}`}>
                Siguiente <Icon name="arrow" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
