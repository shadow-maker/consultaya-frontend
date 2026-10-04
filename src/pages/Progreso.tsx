import { Link } from 'react-router';
import { useModulos, useResumen } from '../api/hooks';
import { Cargando, ErrorCarga } from '../components/Carga';
import { Barra, PuntoEstado } from '../components/Estado';
import { Icon } from '../components/Icon';
import { plural } from '../sql/comparar';
import { fmtDate } from '../sql/formato';
import { numeroDeEjercicio } from '../utilidades';
import { useTitulo } from './useTitulo';

export default function Progreso() {
  useTitulo('Mi progreso');
  const resumen = useResumen();
  const modulos = useModulos();

  if (resumen.isError) return <ErrorCarga error={resumen.error} onReintentar={() => void resumen.refetch()} />;
  if (modulos.isError) return <ErrorCarga error={modulos.error} onReintentar={() => void modulos.refetch()} />;
  if (!resumen.data || !modulos.data) return <Cargando />;

  const r = resumen.data;
  const lecciones = modulos.data.flatMap((m) => m.lecciones.map((l) => ({ ...l, modulo: m })));
  const primera = lecciones[0];

  const cabecera = (
    <div className="page-head">
      <div>
        <p className="eyebrow">Mi progreso</p>
        <h1>Mi progreso</h1>
      </div>
    </div>
  );

  if (r.completados === 0) {
    return (
      <div className="wrap page">
        {cabecera}
        <div className="card empty" data-testid="progreso-vacio">
          <div className="big-ic">
            <Icon name="chart" />
          </div>
          <h2>Aún no tienes avance</h2>
          <p className="muted">
            Cuando completes tu primer ejercicio, aquí verás tu porcentaje de avance por módulo y el historial de ejercicios resueltos.
          </p>
          {primera && (
            <Link className="btn primary lg" to={`/leccion/${primera.slug}`} data-testid="progreso-empezar">
              Empezar la primera lección <Icon name="arrow" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  const estadoLeccion = (ids: string[]) => {
    const hechos = new Set(r.ejercicios_completados.map((e) => e.ejercicio_id));
    const n = ids.filter((id) => hechos.has(id)).length;
    return n === ids.length ? 'completada' : n > 0 ? 'en_curso' : 'pendiente';
  };

  return (
    <div className="wrap page">
      {cabecera}
      <div className="stats">
        <div className="card stat">
          <div className="k">Avance total</div>
          <div className="v">{r.porcentaje}%</div>
        </div>
        <div className="card stat">
          <div className="k">Ejercicios completados</div>
          <div className="v">
            {r.completados}
            <small> / {r.total}</small>
          </div>
        </div>
        <div className="card stat">
          <div className="k">Lecciones completadas</div>
          <div className="v">
            {r.lecciones_completadas}
            <small> / {r.lecciones_total}</small>
          </div>
        </div>
        <div className="card stat">
          <div className="k">Último ejercicio</div>
          <div className="v" style={{ fontSize: 17, marginTop: 8 }}>
            {r.ultimo_completado_en ? fmtDate(r.ultimo_completado_en) : '—'}
          </div>
        </div>
      </div>

      <h2>Avance por módulo</h2>
      <div className="prog-grid">
        {modulos.data.map((m) => {
          const pm = r.modulos.find((x) => x.slug === m.slug);
          const pct = pm?.porcentaje ?? 0;
          return (
            <div className="card prog-mod" key={m.slug} data-testid={`progreso-modulo-${m.slug}`}>
              <div className="card-head">
                <h3>{m.nombre}</h3>
                <span className="muted small">
                  {pm?.completados ?? 0}/{pm?.total ?? 0} ejercicios
                </span>
              </div>
              <div className="pct">{pct}%</div>
              <Barra porcentaje={pct} />
              <ul>
                {m.lecciones.map((l) => (
                  <li key={l.slug}>
                    <PuntoEstado estado={estadoLeccion(l.ejercicios.map((e) => e.id))} />
                    <Link to={`/ruta/${l.slug}`} style={{ color: 'var(--ink)' }}>
                      {l.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="card table-card">
        <div className="card-head">
          <h3>Ejercicios completados</h3>
          <span className="muted small">{plural(r.ejercicios_completados.length, 'ejercicio')}</span>
        </div>
        <div className="table-scroll">
          <table className="list">
            <thead>
              <tr>
                <th>Ejercicio</th>
                <th>Lección</th>
                <th>Módulo</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {r.ejercicios_completados.map((e) => {
                const l = lecciones.find((x) => x.slug === e.leccion_slug);
                return (
                  <tr key={e.ejercicio_id} data-testid={`progreso-completado-${e.ejercicio_id}`}>
                    <td>
                      <b>Ejercicio {numeroDeEjercicio(e.ejercicio_id)}</b>
                    </td>
                    <td>{l?.titulo ?? e.leccion_slug}</td>
                    <td>{l?.modulo.nombre ?? ''}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.completado_en)}</td>
                    <td>
                      <Link to={`/ejercicio/${e.ejercicio_id}`}>Repasar</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3>Certificados</h3>
          <span className="chip st-pendiente">Próximamente</span>
        </div>
        {modulos.data.map((m) => {
          const pm = r.modulos.find((x) => x.slug === m.slug);
          const faltan = (pm?.total ?? 0) - (pm?.completados ?? 0);
          return (
            <div className="cert-row" key={m.slug}>
              <div className={`cert-ic ${faltan ? '' : 'ok'}`}>
                <Icon name="award" />
              </div>
              <div style={{ flex: 1 }}>
                <b>Certificado del módulo {m.nombre}</b>
                <div className="muted small">
                  {faltan ? `Te faltan ${plural(faltan, 'ejercicio')} para obtenerlo` : '¡Módulo completado! La descarga estará disponible próximamente.'}
                </div>
              </div>
              <button className="btn sm" disabled>
                <Icon name="lock" /> Descargar certificado
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
