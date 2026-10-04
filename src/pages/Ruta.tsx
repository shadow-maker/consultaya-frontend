import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/cliente';
import { useDataset, useLeccion, useModulos, useResumen, useRuta } from '../api/hooks';
import type { EstadoLeccion, Leccion, Modulo, Resumen, Ruta as RutaProgreso } from '../api/tipos';
import { Cargando, ErrorCarga } from '../components/Carga';
import { Barra, ChipEstado, PuntoEstado } from '../components/Estado';
import { Icon } from '../components/Icon';
import { fmtDate } from '../sql/formato';
import { stripAccents } from '../sql/sugerencias';
import { numeroDeEjercicio } from '../utilidades';
import NotFound from './NotFound';
import { useTitulo } from './useTitulo';

/** Estado de una lección combinando estructura (lecciones) y avance (progreso) por `slug`. */
function estadoDe(ruta: RutaProgreso, slug: string) {
  for (const m of ruta.modulos) {
    const l = m.lecciones.find((x) => x.slug === slug);
    if (l) return l;
  }
  return { slug, estado: 'pendiente' as EstadoLeccion, completados: 0, total: 0 };
}

const etiquetaBoton = (e: EstadoLeccion) => (e === 'pendiente' ? 'Abrir' : e === 'en_curso' ? 'Continuar' : 'Repasar');

function ListaLateral({ modulos, ruta, busqueda, activa }: { modulos: Modulo[]; ruta: RutaProgreso; busqueda: string; activa?: string }) {
  const q = stripAccents(busqueda.toLowerCase().trim());
  const grupos = modulos
    .map((m) => ({
      m,
      lecciones: m.lecciones.filter((l) => !q || stripAccents(`${l.titulo} ${l.resumen} ${l.tags.join(' ')}`.toLowerCase()).includes(q)),
    }))
    .filter((g) => g.lecciones.length);
  if (!grupos.length) {
    return (
      <p className="muted small" style={{ padding: '14px 8px 4px' }}>
        No encontramos lecciones para “{busqueda}”.
      </p>
    );
  }
  return (
    <>
      {grupos.map(({ m, lecciones }) => (
        <div className="side-mod" key={m.slug}>
          <h4>
            <span>{m.nombre}</span>
            <span>{ruta.modulos.find((x) => x.slug === m.slug)?.porcentaje ?? 0}%</span>
          </h4>
          {lecciones.map((l) => (
            <Link key={l.slug} className={`side-item ${l.slug === activa ? 'active' : ''}`} to={`/ruta/${l.slug}`}>
              <PuntoEstado estado={estadoDe(ruta, l.slug).estado} />
              <span>{l.titulo}</span>
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}

function Panorama({ modulos, ruta }: { modulos: Modulo[]; ruta: RutaProgreso }) {
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Ruta de aprendizaje</p>
          <h1>De cero a analista en {modulos.length} módulos</h1>
          <p className="muted">Sigue las lecciones en orden. Cada una tiene una explicación corta y ejercicios con validación automática.</p>
        </div>
      </div>
      {modulos.map((m, i) => {
        const pm = ruta.modulos.find((x) => x.slug === m.slug);
        const pct = pm?.porcentaje ?? 0;
        return (
          <section className="card module" key={m.slug} data-testid={`modulo-${m.slug}`}>
            <div className="module-head">
              <div className="mod-n">{i + 1}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2>{m.nombre}</h2>
                <p className="muted">{m.descripcion}</p>
              </div>
              <div className="mod-pct">
                <b>{pct}%</b>
                <Barra porcentaje={pct} />
                <span className="muted small">
                  {pm?.completados ?? 0}/{pm?.total ?? 0} ejercicios
                </span>
              </div>
            </div>
            <ol className="lesson-list">
              {m.lecciones.map((l) => {
                const e = estadoDe(ruta, l.slug);
                return (
                  <li className="lesson-row" key={l.slug} data-testid={`leccion-${l.slug}`}>
                    <PuntoEstado estado={e.estado} />
                    <div>
                      <Link to={`/ruta/${l.slug}`} className="lr-title">
                        {l.titulo}
                      </Link>
                      <div className="muted small">{l.resumen}</div>
                    </div>
                    <div className="lr-meta">
                      <ChipEstado estado={e.estado} testId={`leccion-estado-${l.slug}`} />
                      <span className="muted small">
                        {l.duracion_min} min · {e.completados}/{e.total || l.ejercicios.length} ejercicios
                      </span>
                    </div>
                    <Link className={`btn sm ${e.estado === 'completada' ? '' : 'primary'}`} to={`/leccion/${l.slug}`} data-testid={`leccion-abrir-${l.slug}`}>
                      {etiquetaBoton(e.estado)}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </>
  );
}

function ResumenLeccion({ leccion, datasetNombre, modulos, ruta, resumen }: { leccion: Leccion; datasetNombre: string; modulos: Modulo[]; ruta: RutaProgreso; resumen: Resumen }) {
  const e = estadoDe(ruta, leccion.slug);
  const total = leccion.ejercicios.length;
  const pct = total ? Math.round((100 * e.completados) / total) : 0;
  const fechas = new Map(resumen.ejercicios_completados.map((c) => [c.ejercicio_id, c.completado_en]));
  const primerPendiente = leccion.ejercicios.find((x) => !fechas.has(x.id)) ?? leccion.ejercicios[0];
  const posicion = modulos.flatMap((m) => m.lecciones).findIndex((l) => l.slug === leccion.slug) + 1;

  return (
    <>
      <div className="crumbs">
        <Link to="/ruta">Ruta</Link>
        <span>/</span>Módulo {leccion.modulo.nombre}
        <span>/</span>
        {leccion.titulo}
      </div>
      <div className="card lesson-sum">
        <p className="eyebrow">
          Lección {posicion} · {leccion.modulo.nombre}
        </p>
        <h1>{leccion.titulo}</h1>
        <p className="lead-sm">{leccion.resumen}</p>
        <div className="meta-row">
          <ChipEstado estado={e.estado} />
          <span>
            <Icon name="clock" /> {leccion.duracion_min} min
          </span>
          <span>
            <Icon name="db" /> {datasetNombre}
          </span>
        </div>
        <div className="ls-progress">
          <Barra porcentaje={pct} />
          <span className="muted small">
            {e.completados} de {total} ejercicios completados
          </span>
        </div>
        <div className="ls-cols">
          <div>
            <h3>Lo que aprenderás</h3>
            <ul className="feat-list">
              {leccion.aprenderas.map((a) => (
                <li key={a}>
                  <Icon name="check" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Contenido</h3>
            <ol className="toc">
              {leccion.secciones.map((s) => (
                <li key={s.orden}>{s.titulo}</li>
              ))}
            </ol>
            <h3>Ejercicios</h3>
            <ul className="ex-list">
              {leccion.ejercicios.map((x) => {
                const fecha = fechas.get(x.id);
                return (
                  <li key={x.id}>
                    <Link to={`/ejercicio/${x.id}`}>
                      <PuntoEstado estado={fecha ? 'completada' : 'pendiente'} />
                      <span>Ejercicio {numeroDeEjercicio(x.id)}</span>
                    </Link>
                    {fecha && <span className="muted small">{fmtDate(fecha)}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="row-btns" style={{ marginTop: 24 }}>
          <Link className="btn primary lg" to={`/leccion/${leccion.slug}`}>
            {e.estado === 'pendiente' ? 'Empezar lección' : e.estado === 'en_curso' ? 'Continuar lección' : 'Repasar lección'} <Icon name="arrow" />
          </Link>
          {primerPendiente && (
            <Link className="btn lg" to={`/ejercicio/${primerPendiente.id}`}>
              Ir a los ejercicios
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default function Ruta() {
  const { slug } = useParams();
  const [busqueda, setBusqueda] = useState('');
  const modulos = useModulos();
  const ruta = useRuta();
  const resumen = useResumen();
  const leccion = useLeccion(slug);
  const dataset = useDataset(leccion.data?.dataset);
  useTitulo(leccion.data?.titulo ?? 'Ruta de aprendizaje');

  if (leccion.error instanceof ApiError && leccion.error.codigo === 'LECCION_NO_EXISTE') return <NotFound />;
  const fallo = modulos.error ?? ruta.error ?? resumen.error ?? leccion.error;
  if (fallo) {
    return (
      <ErrorCarga
        error={fallo}
        onReintentar={() => {
          void modulos.refetch();
          void ruta.refetch();
          void resumen.refetch();
          void leccion.refetch();
        }}
      />
    );
  }
  if (!modulos.data || !ruta.data || !resumen.data || (slug && !leccion.data)) return <Cargando />;

  return (
    <div className="wrap page">
      <div className="explorer">
        <aside className="card sidebar" aria-label="Explorador de lecciones">
          <div className="search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Buscar (ej. JOIN, WHERE…)"
              aria-label="Buscar lecciones"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Link className={`side-item all ${!slug ? 'active' : ''}`} to="/ruta">
            <Icon name="map" /> Toda la ruta
          </Link>
          <div>
            <ListaLateral modulos={modulos.data} ruta={ruta.data} busqueda={busqueda} activa={slug} />
          </div>
        </aside>
        <main>
          {leccion.data ? (
            <ResumenLeccion leccion={leccion.data} datasetNombre={dataset.data?.nombre ?? leccion.data.dataset} modulos={modulos.data} ruta={ruta.data} resumen={resumen.data} />
          ) : (
            <Panorama modulos={modulos.data} ruta={ruta.data} />
          )}
        </main>
      </div>
    </div>
  );
}
