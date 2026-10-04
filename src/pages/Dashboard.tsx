import { Link } from 'react-router';
import { useModulos, useResumen } from '../api/hooks';
import type { Modulo, Resumen } from '../api/tipos';
import { useAuth } from '../auth/auth-contexto';
import { Cargando, ErrorCarga } from '../components/Carga';
import { CodigoSql } from '../components/CodigoSql';
import { Anillo, Barra } from '../components/Estado';
import { Icon } from '../components/Icon';
import { plural } from '../sql/comparar';
import { primerNombre } from '../utilidades';
import { useTitulo } from './useTitulo';

interface Logro {
  nombre: string;
  descripcion: string;
  ok: boolean;
}

/** Los logros se calculan en el cliente con el resumen y la estructura de la ruta. */
function calcularLogros(resumen: Resumen, modulos: Modulo[]): Logro[] {
  const hechos = new Set(resumen.ejercicios_completados.map((e) => e.ejercicio_id));
  const leccionCompleta = (slug: string) => {
    const l = modulos.flatMap((m) => m.lecciones).find((x) => x.slug === slug);
    return !!l && l.ejercicios.length > 0 && l.ejercicios.every((e) => hechos.has(e.id));
  };
  const basico = resumen.modulos.find((m) => m.slug === 'basico');
  return [
    { nombre: 'Primera consulta', descripcion: 'Completa tu primer ejercicio', ok: resumen.completados >= 1 },
    { nombre: 'Buen filtro', descripcion: 'Completa la lección de WHERE', ok: leccionCompleta('where') },
    { nombre: 'Módulo Básico', descripcion: 'Completa el módulo Básico', ok: !!basico && basico.total > 0 && basico.porcentaje === 100 },
    { nombre: 'Agrupador', descripcion: 'Completa la lección de GROUP BY', ok: leccionCompleta('group-by') },
    { nombre: 'Conector', descripcion: 'Completa la lección de JOIN', ok: leccionCompleta('join') },
    { nombre: 'Analista', descripcion: 'Completa toda la ruta', ok: resumen.total > 0 && resumen.completados === resumen.total },
  ];
}

export default function Dashboard() {
  useTitulo('Mi panel');
  const { usuario } = useAuth();
  const resumen = useResumen();
  const modulos = useModulos();

  if (resumen.isError) return <ErrorCarga error={resumen.error} onReintentar={() => void resumen.refetch()} />;
  if (modulos.isError) return <ErrorCarga error={modulos.error} onReintentar={() => void modulos.refetch()} />;
  if (!resumen.data || !modulos.data || !usuario) return <Cargando />;

  const r = resumen.data;
  const lecciones = modulos.data.flatMap((m) => m.lecciones.map((l) => ({ ...l, modulo: m })));
  const siguiente = r.siguiente ? lecciones.find((l) => l.slug === r.siguiente!.leccion_slug) : undefined;
  const hechos = new Set(r.ejercicios_completados.map((e) => e.ejercicio_id));
  const logros = calcularLogros(r, modulos.data);

  let continuar;
  if (!r.siguiente || !siguiente) {
    continuar = (
      <>
        <p className="eyebrow">Ruta completada</p>
        <h2>¡Completaste las {r.lecciones_total} lecciones!</h2>
        <p className="muted">Repasa cualquier lección o explora los datos en el modo libre.</p>
        <div className="row-btns">
          <Link className="btn primary lg" to="/progreso">
            Ver mi progreso
          </Link>
          <Link className="btn lg" to="/playground">
            Abrir modo libre
          </Link>
        </div>
      </>
    );
  } else {
    const hechosLeccion = siguiente.ejercicios.filter((e) => hechos.has(e.id)).length;
    const pct = siguiente.ejercicios.length ? Math.round((100 * hechosLeccion) / siguiente.ejercicios.length) : 0;
    const href = r.siguiente.ejercicio_id ? `/ejercicio/${r.siguiente.ejercicio_id}` : `/leccion/${siguiente.slug}`;
    const sinAvance = r.completados === 0;
    continuar = (
      <>
        <p className="eyebrow">{sinAvance ? 'Empieza aquí' : 'Continúa donde te quedaste'}</p>
        <h2>{siguiente.titulo}</h2>
        <p className="muted">
          Módulo {siguiente.modulo.nombre} · {siguiente.duracion_min} min · {hechosLeccion} de {siguiente.ejercicios.length} ejercicios
        </p>
        <Barra porcentaje={pct} grande />
        <div className="row-btns">
          <Link className="btn primary lg" to={href} data-testid="dashboard-continuar">
            {sinAvance ? 'Empezar la primera lección' : 'Continuar'} <Icon name="arrow" />
          </Link>
          <Link className="btn lg" to="/ruta">
            Ver ruta completa
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="wrap page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Hola, {primerNombre(usuario.nombres)}</p>
          <h1>Tu panel de aprendizaje</h1>
        </div>
      </div>
      <div className="dash">
        <section className="card span-8 continue">{continuar}</section>

        <section className="card span-4">
          <div className="card-head">
            <h3>Avance general</h3>
          </div>
          <div className="overall-in">
            <Anillo porcentaje={r.porcentaje} />
            <ul className="kv">
              <li>
                <span>Ejercicios</span>
                <b>
                  {r.completados}/{r.total}
                </b>
              </li>
              <li>
                <span>Lecciones</span>
                <b>
                  {r.lecciones_completadas}/{r.lecciones_total}
                </b>
              </li>
              <li>
                <span>Módulos</span>
                <b>
                  {r.modulos_completados}/{r.modulos_total}
                </b>
              </li>
            </ul>
          </div>
          <Link className="link-arrow" to="/progreso">
            Ver detalle <Icon name="arrow" />
          </Link>
        </section>

        <section className="card span-6">
          <h3>Avance por módulo</h3>
          {modulos.data.map((m) => {
            const ms = r.modulos.find((x) => x.slug === m.slug);
            const pct = ms?.porcentaje ?? 0;
            return (
              <div className="mod-line" key={m.slug}>
                <div className="mod-line-top">
                  <b>{m.nombre}</b>
                  <span className="muted small">
                    {ms?.completados ?? 0}/{ms?.total ?? 0} ejercicios · {pct}%
                  </span>
                </div>
                <Barra porcentaje={pct} />
              </div>
            );
          })}
        </section>

        <section className="card span-6">
          <h3>Logros</h3>
          <div className="badges">
            {logros.map((b) => (
              <div className={`badge ${b.ok ? 'on' : ''}`} key={b.nombre} data-testid={`logro-${b.nombre}`}>
                <div className="b-ic">
                  <Icon name={b.ok ? 'star' : 'lock'} />
                </div>
                <span>{b.nombre}</span>
                <small>{b.descripcion}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card span-6">
          <div className="card-head">
            <h3>Certificados</h3>
            <span className="chip st-pendiente">Próximamente</span>
          </div>
          <p className="muted small">Al completar un módulo podrás descargar tu certificado en PDF para tu CV o LinkedIn.</p>
          {modulos.data.map((m) => {
            const ms = r.modulos.find((x) => x.slug === m.slug);
            const faltan = (ms?.total ?? 0) - (ms?.completados ?? 0);
            return (
              <div className="cert-row" key={m.slug}>
                <div className={`cert-ic ${faltan ? '' : 'ok'}`}>
                  <Icon name="award" />
                </div>
                <div style={{ flex: 1 }}>
                  <b>Certificado {m.nombre}</b>
                  <div className="muted small">{faltan ? `Te faltan ${plural(faltan, 'ejercicio')}` : '¡Módulo completado!'}</div>
                </div>
                <button className="btn sm" disabled title="Disponible próximamente">
                  <Icon name="lock" /> Descargar
                </button>
              </div>
            );
          })}
        </section>

        <section className="card span-6">
          <div className="card-head">
            <h3>Modo libre</h3>
            <span className="chip st-pendiente">Vista previa</span>
          </div>
          <p className="muted">
            Escribe cualquier consulta sobre los datasets de la bodega, el delivery o las campañas, sin un ejercicio asignado.
          </p>
          <CodigoSql sql={"SELECT * FROM pedidos\nWHERE distrito = 'Lince';"} className="code sm" />
          <Link className="btn" to="/playground">
            <Icon name="terminal" /> Abrir modo libre
          </Link>
        </section>
      </div>
    </div>
  );
}
