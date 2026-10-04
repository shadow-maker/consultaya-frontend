import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../auth/auth-contexto';
import { CodigoSql } from '../components/CodigoSql';
import { Icon, type NombreIcono } from '../components/Icon';
import { TablaResultado } from '../components/TablaResultado';
import { useToast } from '../components/toast-contexto';
import type { ResultadoSQL } from '../sql/tipos';
import { useTitulo } from './useTitulo';

const SQL_DEMO = "SELECT distrito, SUM(monto) AS total\nFROM pedidos\nWHERE estado = 'entregado'\nGROUP BY distrito\nORDER BY total DESC\nLIMIT 3;";

/** Resultado de `SQL_DEMO` sobre el dataset de delivery (la landing no depende del backend). */
const RESULTADO_DEMO: ResultadoSQL = {
  columnas: ['distrito', 'total'],
  filas: [
    ['Miraflores', 275.4],
    ['Lince', 161.7],
    ['San Isidro', 137.5],
  ],
};

const DATASETS: { icono: NombreIcono; nombre: string; lugar: string; descripcion: string; tablas: string[] }[] = [
  {
    icono: 'store',
    nombre: 'Bodega Doña Rosa',
    lugar: 'Surquillo, Lima',
    descripcion: 'Productos, clientes y ventas diarias de una bodega de barrio.',
    tablas: ['productos', 'clientes', 'ventas'],
  },
  {
    icono: 'bike',
    nombre: 'RapiMenú',
    lugar: 'Lima Metropolitana',
    descripcion: 'Pedidos de una app de delivery por distrito: montos, estados y fechas.',
    tablas: ['restaurantes', 'pedidos'],
  },
  {
    icono: 'megaphone',
    nombre: 'Campañas de TiendaNova',
    lugar: 'Tienda online',
    descripcion: 'Presupuesto, clics y conversiones de campañas de marketing digital.',
    tablas: ['campanas'],
  },
];

const PLANES = [
  {
    id: 'Gratis',
    precio: 'S/ 0',
    periodo: 'para siempre',
    descripcion: 'Todo lo necesario para aprender SQL desde cero.',
    destacado: false,
    caracteristicas: [
      'Ruta completa: Básico, Intermedio y Avanzado',
      'Lecciones en español con ejemplos',
      'Ejercicios con validación automática',
      'Errores explicados en español',
      'Seguimiento de tu progreso',
    ],
  },
  {
    id: 'Pro',
    precio: 'S/ 24.90',
    periodo: 'al mes',
    descripcion: 'Para practicar más y demostrar lo que sabes.',
    destacado: true,
    caracteristicas: [
      'Todo lo del plan Gratis',
      'Tutor IA con pistas personalizadas',
      'Modo libre con todos los datasets',
      'Certificados por módulo en PDF',
      'Ejercicios nuevos cada mes',
    ],
  },
  {
    id: 'Equipos',
    precio: 'A medida',
    periodo: '',
    descripcion: 'Para universidades, institutos y empresas.',
    destacado: false,
    caracteristicas: [
      'Todo lo del plan Pro',
      'Panel para docentes o líderes de equipo',
      'Ejercicios propios del curso o la empresa',
      'Reportes de avance por grupo',
    ],
  },
];

const Si = ({ children }: { children: ReactNode }) => <span className="yes">{children}</span>;
const No = ({ children }: { children: ReactNode }) => <span className="no">{children}</span>;
const Parcial = ({ children }: { children: ReactNode }) => <span className="part">{children}</span>;

function FilaComparativa({ titulo, filas }: { titulo: string; filas: [ReactNode, ReactNode, ReactNode, ReactNode] }) {
  return (
    <tr>
      <th scope="row">{titulo}</th>
      <td className="us">{filas[0]}</td>
      <td>{filas[1]}</td>
      <td>{filas[2]}</td>
      <td>{filas[3]}</td>
    </tr>
  );
}

export default function Home() {
  useTitulo('Aprende SQL practicando');
  const { usuario } = useAuth();
  const toast = useToast();
  const ubicacion = useLocation();
  const scroll = (ubicacion.state as { scroll?: string } | null)?.scroll;

  // Venir desde otra pantalla con «Cómo funciona», «Precios»…: baja a la sección pedida.
  useEffect(() => {
    if (scroll) document.getElementById(scroll)?.scrollIntoView({ block: 'start' });
  }, [scroll]);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">SQL desde cero · 100% en español</p>
            <h1>
              Aprende SQL <em>practicando</em> con datos de negocios que conoces.
            </h1>
            <p className="lead">
              Lecciones cortas, un editor SQL en el navegador y errores explicados en español. Practica con las ventas de una bodega,
              los pedidos de un delivery y las campañas de una tienda online.
            </p>
            <div className="hero-ctas">
              {usuario ? (
                <Link className="btn primary lg" to="/dashboard">
                  Ir a mi panel <Icon name="arrow" />
                </Link>
              ) : (
                <>
                  <Link className="btn primary lg" to="/registro">
                    Crear cuenta gratis <Icon name="arrow" />
                  </Link>
                  <Link className="btn lg" to="/login">
                    Ya tengo cuenta
                  </Link>
                </>
              )}
            </div>
            <div className="hero-checks">
              <span>
                <Icon name="check" /> Sin instalar nada
              </span>
              <span>
                <Icon name="check" /> 8 lecciones · 16 ejercicios
              </span>
              <span>
                <Icon name="check" /> Gratis para empezar
              </span>
            </div>
          </div>
          <div className="mock" aria-label="Vista previa de un ejercicio">
            <div className="mock-top">
              <i></i>
              <i></i>
              <i></i>
              <span style={{ marginLeft: 8 }}>Ejercicio · RapiMenú delivery</span>
            </div>
            <CodigoSql sql={SQL_DEMO} />
            <div className="mock-res">
              <TablaResultado resultado={RESULTADO_DEMO} />
            </div>
            <div className="mock-fb">
              <Icon name="check" /> ¡Respuesta correcta! Ejercicio completado.
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="como">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Cómo funciona</p>
            <h2>Aprende haciendo, en tres pasos</h2>
            <p>Cada lección combina una explicación corta con ejercicios que se validan solos.</p>
          </div>
          <div className="grid3">
            <div className="card">
              <div className="step-n">1</div>
              <h3>Lee una lección corta</h3>
              <p className="muted">Explicaciones en español, con consultas de ejemplo y su resultado a la vista.</p>
            </div>
            <div className="card">
              <div className="step-n">2</div>
              <h3>Escribe tu consulta</h3>
              <p className="muted">Un editor SQL en el navegador, con datos de negocios reales. No necesitas instalar nada.</p>
            </div>
            <div className="card">
              <div className="step-n">3</div>
              <h3>Recibe feedback al instante</h3>
              <p className="muted">
                Si algo falla, te explicamos el error en español y en qué se diferencia tu resultado del esperado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="datasets">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Datasets</p>
            <h2>Datos de negocios latinoamericanos</h2>
            <p>Nada de tablas abstractas: practicas con situaciones que reconoces del día a día.</p>
          </div>
          <div className="grid3">
            {DATASETS.map((d) => (
              <div className="card" key={d.nombre}>
                <div className="ds-ic">
                  <Icon name={d.icono} />
                </div>
                <h3>{d.nombre}</h3>
                <p className="muted small" style={{ margin: '-4px 0 8px' }}>
                  {d.lugar}
                </p>
                <p className="muted">{d.descripcion}</p>
                <div className="tags">
                  {d.tablas.map((t) => (
                    <code key={t}>{t}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="comparativa">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Propuesta de valor</p>
            <h2>¿Por qué ConsultaYa?</h2>
            <p>Aprender SQL desde cero en español, con problemas de negocio conocidos.</p>
          </div>
          <div className="compare-wrap">
            <table className="compare">
              <thead>
                <tr>
                  <th></th>
                  <th className="us">ConsultaYa</th>
                  <th>DataCamp</th>
                  <th>HackerRank</th>
                  <th>LeetCode</th>
                </tr>
              </thead>
              <tbody>
                <FilaComparativa
                  titulo="Enfoque principal"
                  filas={['Aprender SQL desde cero', 'Plataforma completa de datos e IA', 'Certificar habilidades ante empleadores', 'Preparar entrevistas técnicas']}
                />
                <FilaComparativa
                  titulo="Contenido en español"
                  filas={[<Si>Sí, todo</Si>, <Parcial>Parcial</Parcial>, <No>No</No>, <No>No</No>]}
                />
                <FilaComparativa
                  titulo="Datos de negocios latinoamericanos"
                  filas={[<Si>Sí</Si>, <No>No</No>, <No>No</No>, <No>No</No>]}
                />
                <FilaComparativa
                  titulo="Errores explicados en español"
                  filas={[<Si>Sí</Si>, <No>No</No>, <No>No</No>, <No>No</No>]}
                />
                <FilaComparativa
                  titulo="Pensado para principiantes"
                  filas={[<Si>Sí</Si>, <Si>Sí</Si>, <Parcial>Parcial</Parcial>, <No>No</No>]}
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section alt" id="precios">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Precios</p>
            <h2>Empieza gratis, mejora cuando quieras</h2>
            <p>La ruta completa es gratuita. Pro suma herramientas para practicar más y certificarte.</p>
          </div>
          <div className="pricing">
            {PLANES.map((p) => (
              <div className={`card price-card ${p.destacado ? 'featured' : ''}`} key={p.id}>
                {p.destacado && <span className="ribbon">Más popular</span>}
                <h3>{p.id}</h3>
                <div className="price">
                  {p.precio} {p.periodo && <small>{p.periodo}</small>}
                </div>
                <p className="muted">{p.descripcion}</p>
                <ul className="feat-list">
                  {p.caracteristicas.map((c) => (
                    <li key={c}>
                      <Icon name="check" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                {p.id === 'Equipos' ? (
                  <button type="button" className="btn" onClick={() => toast.mostrar('Próximamente podrás escribirnos desde aquí.')}>
                    Contactar
                  </button>
                ) : (
                  <Link
                    className={`btn ${p.destacado ? 'primary' : ''}`}
                    to={usuario ? (p.id === 'Pro' ? '/perfil' : '/dashboard') : '/registro'}
                  >
                    {p.id === 'Pro' ? 'Probar Pro' : 'Crear cuenta gratis'}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Tu primera consulta te toma menos de 5 minutos</h2>
              <p>Crea tu cuenta y empieza con la lección de SELECT.</p>
            </div>
            <Link className="btn accent lg" to={usuario ? '/dashboard' : '/registro'}>
              {usuario ? 'Ir a mi panel' : 'Crear cuenta gratis'} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
