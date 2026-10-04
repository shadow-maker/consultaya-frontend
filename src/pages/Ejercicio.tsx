import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/cliente';
import { claves, useArchivoDataset, useDataset, useEjercicio, useLeccion, useModulos, useResumen } from '../api/hooks';
import { completarEjercicio, registrarVisita } from '../api/progreso';
import type { Dataset, Ejercicio as EjercicioApi, Leccion, Modulo, Resumen } from '../api/tipos';
import { useAuth } from '../auth/auth-contexto';
import { Cargando, ErrorCarga } from '../components/Carga';
import { EditorSql, type EditorApi } from '../components/EditorSql';
import { ErrorSql } from '../components/ErrorSql';
import { Esquema } from '../components/Esquema';
import { PuntoEstado } from '../components/Estado';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { BloqueResultado } from '../components/TablaResultado';
import { useToast } from '../components/toast-contexto';
import { compararResultados } from '../sql/comparar';
import { ejecutar } from '../sql/engine';
import { esquemaDeTablas } from '../sql/esquema';
import { fmtDate } from '../sql/formato';
import type { ErrorSql as ErrorSqlTipo, ResultadoEjecucion } from '../sql/tipos';
import { numeroDeEjercicio } from '../utilidades';
import NotFound from './NotFound';
import { useTitulo } from './useTitulo';

const INICIAL = '-- Escribe tu consulta aquí\n';

const claveBorrador = (usuarioId: string, ejercicioId: string) => `consultaya.borrador.${usuarioId}.${ejercicioId}`;

function leerBorrador(clave: string): string {
  try {
    return window.localStorage.getItem(clave) ?? INICIAL;
  } catch {
    return INICIAL;
  }
}

function guardarBorrador(clave: string, valor: string) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    /* sin localStorage: el borrador no se conserva */
  }
}

type Salida =
  | null
  | { tipo: 'resultado'; resultado: ResultadoEjecucion }
  | { tipo: 'error'; error: ErrorSqlTipo }
  | { tipo: 'incorrecto'; mensaje: string; detalle: string; resultado: ResultadoEjecucion }
  | { tipo: 'correcto'; nuevo: boolean; guardado: boolean; resultado: ResultadoEjecucion };

interface PanelProps {
  ejercicio: EjercicioApi;
  leccion: Leccion;
  dataset: Dataset;
  bytes: Uint8Array | undefined;
  errorArchivo: boolean;
  resumen: Resumen | undefined;
  modulos: Modulo[] | undefined;
}

function Panel({ ejercicio, leccion, dataset, bytes, errorArchivo, resumen, modulos }: PanelProps) {
  const { usuario } = useAuth();
  const toast = useToast();
  const queries = useQueryClient();
  const editor = useRef<EditorApi>(null);

  const clave = claveBorrador(usuario!.id, ejercicio.id);
  const [sql, setSql] = useState(() => leerBorrador(clave));
  const [salida, setSalida] = useState<Salida>(null);
  const [haEjecutado, setHaEjecutado] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  const esquema = esquemaDeTablas(dataset.tablas);
  const fechas = new Map(resumen?.ejercicios_completados.map((e) => [e.ejercicio_id, e.completado_en]));
  const completadoEn = fechas.get(ejercicio.id);
  const listo = !!bytes && !trabajando;

  const cambiar = (valor: string) => {
    setSql(valor);
    guardarBorrador(clave, valor);
  };

  async function ejecutarConsulta() {
    if (!bytes) return;
    setTrabajando(true);
    try {
      const r = await ejecutar(bytes, sql, esquema);
      setHaEjecutado(true);
      setSalida(r.ok ? { tipo: 'resultado', resultado: r.resultado } : { tipo: 'error', error: r.error });
    } finally {
      setTrabajando(false);
    }
  }

  async function enviarRespuesta() {
    if (!bytes) return;
    setTrabajando(true);
    try {
      const r = await ejecutar(bytes, sql, esquema);
      if (!r.ok) {
        setSalida({ tipo: 'error', error: r.error });
        return;
      }
      const cmp = compararResultados(r.resultado, ejercicio.resultado_esperado, ejercicio.ordenado);
      if (!cmp.ok) {
        setSalida({ tipo: 'incorrecto', mensaje: cmp.mensaje, detalle: cmp.detalle, resultado: r.resultado });
        return;
      }
      try {
        const resp = await completarEjercicio(ejercicio.id, sql);
        setSalida({ tipo: 'correcto', nuevo: resp.nuevo, guardado: true, resultado: r.resultado });
        const modulo = resumen?.modulos.find((m) => m.slug === leccion.modulo.slug);
        if (resp.nuevo && modulo && modulo.completados + 1 === modulo.total) {
          toast.mostrar(`¡Completaste el módulo ${leccion.modulo.nombre}!`);
        }
        await queries.invalidateQueries({ queryKey: claves.progreso });
      } catch (e) {
        // La respuesta es correcta aunque no se haya podido guardar: se muestra y se avisa.
        if (e instanceof ApiError && e.codigo === 'NO_AUTENTICADO') return; // la sesión expirada ya redirige
        setSalida({ tipo: 'correcto', nuevo: false, guardado: false, resultado: r.resultado });
      }
    } finally {
      setTrabajando(false);
    }
  }

  // ¿Qué sigue después de una respuesta correcta?
  const siguienteEjercicio = leccion.ejercicios.find((e) => e.orden === ejercicio.orden + 1);
  const siguienteLeccion = leccion.siguiente ? modulos?.flatMap((m) => m.lecciones).find((l) => l.slug === leccion.siguiente) : undefined;
  const [hrefSiguiente, etiquetaSiguiente] = siguienteEjercicio
    ? [`/ejercicio/${siguienteEjercicio.id}`, 'Siguiente ejercicio']
    : leccion.siguiente
      ? [`/leccion/${leccion.siguiente}`, `Siguiente lección${siguienteLeccion ? `: ${siguienteLeccion.titulo}` : ''}`]
      : ['/progreso', 'Ver mi progreso'];

  return (
    <div className="wrap page">
      <div className="crumbs">
        <Link to="/ruta">Ruta</Link>
        <span>/</span>
        <Link to={`/ruta/${leccion.slug}`}>{leccion.titulo}</Link>
        <span>/</span>Ejercicio {ejercicio.orden}
      </div>
      <div className="ex-top">
        <div className="ex-tabs">
          {leccion.ejercicios.map((e) => {
            const hecho = fechas.has(e.id);
            return (
              <Link
                key={e.id}
                to={`/ejercicio/${e.id}`}
                className={`ex-tab ${e.id === ejercicio.id ? 'active' : ''}`}
                aria-current={e.id === ejercicio.id ? 'page' : undefined}
                data-testid={`ex-tab-${e.id}`}
                data-estado={hecho ? 'completado' : 'pendiente'}
              >
                <PuntoEstado estado={hecho ? 'completada' : 'pendiente'} />
                Ejercicio {numeroDeEjercicio(e.id)}
              </Link>
            );
          })}
        </div>
        <Link className="btn sm ghost" to={`/leccion/${leccion.slug}`}>
          <Icon name="book" /> Ver lección
        </Link>
      </div>

      <div className="ex-layout">
        <section className="card ex-enunciado">
          <p className="eyebrow">
            Ejercicio {ejercicio.orden} de {ejercicio.total_en_leccion} · {leccion.modulo.nombre}
          </p>
          <div className="statement" data-testid="enunciado">
            <Markdown>{ejercicio.enunciado_md}</Markdown>
          </div>
          {completadoEn && (
            <div className="done-note" data-testid="ejercicio-completado">
              <Icon name="check" />
              <span>Completaste este ejercicio el {fmtDate(completadoEn)}. Puedes volver a resolverlo para repasar.</span>
            </div>
          )}
        </section>

        <section className="card ex-esquema">
          <h3>
            Tablas del dataset <span className="muted" style={{ fontWeight: 500 }}>· {dataset.nombre}</span>
          </h3>
          <p className="muted small" style={{ margin: '-4px 0 0' }}>
            Haz clic en una columna para insertarla en el editor.
          </p>
          <Esquema tablas={dataset.tablas} onColumna={(c) => editor.current?.insertar(c)} />
        </section>

        <section className="card ex-editor">
          <div className="editor-head">
            <b>Tu consulta</b>
            <span className="muted small">
              Solo consultas SELECT · <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> para ejecutar
            </span>
          </div>
          <EditorSql valor={sql} onCambio={cambiar} onEjecutar={() => void ejecutarConsulta()} api={editor} />
          <div className="toolbar">
            <button
              className="btn"
              type="button"
              data-testid="ejecutar"
              disabled={!listo}
              title={bytes ? undefined : 'Cargando los datos del ejercicio…'}
              onClick={() => void ejecutarConsulta()}
            >
              <Icon name="play" /> Ejecutar
            </button>
            <button
              className="btn primary"
              type="button"
              data-testid="enviar"
              disabled={!listo || !haEjecutado}
              title={haEjecutado ? undefined : 'Primero ejecuta tu consulta'}
              onClick={() => void enviarRespuesta()}
            >
              <Icon name="send" /> Enviar respuesta
            </button>
            <button className="btn ghost" type="button" disabled title="Próximamente: pistas del tutor IA">
              <Icon name="bulb" /> Pedir pista <span className="chip st-pendiente">Próximamente</span>
            </button>
            <button
              className="btn ghost sm"
              type="button"
              title="Restablecer el editor"
              aria-label="Restablecer el editor"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                cambiar(INICIAL);
                editor.current?.enfocar();
              }}
            >
              <Icon name="reset" />
            </button>
          </div>

          <div data-testid="salida">
            {errorArchivo && !bytes && (
              <ErrorSql
                error={{
                  tipo: 'interno',
                  titulo: 'No pudimos cargar los datos',
                  detalle: 'Falló la descarga del dataset de este ejercicio.',
                  pista: 'Recarga la página e inténtalo de nuevo.',
                }}
              />
            )}
            {!salida && (
              <div className="out-empty">
                <Icon name="table" />
                <p>Ejecuta tu consulta para ver el resultado aquí.</p>
              </div>
            )}
            {salida?.tipo === 'resultado' && <BloqueResultado resultado={salida.resultado} truncado={salida.resultado.truncado} />}
            {salida?.tipo === 'error' && <ErrorSql error={salida.error} />}
            {salida?.tipo === 'incorrecto' && (
              <>
                <div className="feedback err" role="alert" data-testid="feedback-error">
                  <div className="fic">
                    <Icon name="x" />
                  </div>
                  <div>
                    <h4>Todavía no es correcto</h4>
                    <p>{salida.mensaje}</p>
                    <div className="pista">
                      <Icon name="bulb" />
                      <span>{salida.detalle} Edita tu consulta y vuelve a intentarlo.</span>
                    </div>
                  </div>
                </div>
                <BloqueResultado resultado={salida.resultado} truncado={salida.resultado.truncado} />
              </>
            )}
            {salida?.tipo === 'correcto' && (
              <>
                <div className="feedback ok" role="status" data-testid="feedback-ok">
                  <div className="fic">
                    <Icon name="check" />
                  </div>
                  <div>
                    <h4>¡Respuesta correcta!</h4>
                    {salida.guardado ? (
                      <p>{salida.nuevo ? 'El ejercicio se marcó como completado.' : 'Ya lo tenías completado: ¡buen repaso!'}</p>
                    ) : (
                      <p role="alert" data-testid="error-guardar">
                        No pudimos guardar tu avance. Intenta enviar de nuevo.
                      </p>
                    )}
                    <div className="row-btns">
                      {salida.guardado && (
                        <Link className="btn primary sm" to={hrefSiguiente} data-testid="siguiente">
                          {etiquetaSiguiente} <Icon name="arrow" />
                        </Link>
                      )}
                      <Link className="btn sm" to={`/ruta/${leccion.slug}`}>
                        Volver a la lección
                      </Link>
                    </div>
                  </div>
                </div>
                <BloqueResultado resultado={salida.resultado} truncado={salida.resultado.truncado} />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Ejercicio() {
  const { id } = useParams();
  const ejercicio = useEjercicio(id);
  const leccion = useLeccion(ejercicio.data?.leccion_slug);
  const dataset = useDataset(ejercicio.data?.dataset);
  const archivo = useArchivoDataset(dataset.data);
  const resumen = useResumen();
  const modulos = useModulos();
  const queries = useQueryClient();
  useTitulo(ejercicio.data ? `Ejercicio ${ejercicio.data.orden} · ${leccion.data?.titulo ?? ''}` : 'Ejercicio');

  // Abrir el ejercicio cuenta como visita de su lección.
  const leccionSlug = ejercicio.data?.leccion_slug;
  useEffect(() => {
    if (!leccionSlug) return;
    let activo = true;
    registrarVisita(leccionSlug)
      .then(() => {
        if (activo) void queries.invalidateQueries({ queryKey: claves.progreso });
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [leccionSlug, queries]);

  if (ejercicio.error instanceof ApiError && ejercicio.error.codigo === 'EJERCICIO_NO_EXISTE') return <NotFound />;
  const fallo = ejercicio.error ?? leccion.error ?? dataset.error;
  if (fallo) {
    return (
      <ErrorCarga
        error={fallo}
        onReintentar={() => {
          void ejercicio.refetch();
          void leccion.refetch();
          void dataset.refetch();
        }}
      />
    );
  }
  if (!ejercicio.data || !leccion.data || !dataset.data) return <Cargando />;

  return (
    <Panel
      key={ejercicio.data.id}
      ejercicio={ejercicio.data}
      leccion={leccion.data}
      dataset={dataset.data}
      bytes={archivo.data}
      errorArchivo={archivo.isError}
      resumen={resumen.data}
      modulos={modulos.data}
    />
  );
}
