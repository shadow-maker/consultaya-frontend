import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/cliente';
import { actualizarPerfil } from '../api/usuarios';
import { useAuth } from '../auth/auth-contexto';
import { Icon } from '../components/Icon';
import { useToast } from '../components/toast-contexto';
import { fmtDay } from '../sql/formato';
import { useTitulo } from './useTitulo';

const BENEFICIOS_PRO = [
  'Tutor IA con pistas personalizadas',
  'Modo libre con todos los datasets',
  'Certificados por módulo en PDF',
  'Ejercicios nuevos cada mes',
];

export default function Perfil() {
  useTitulo('Perfil');
  const { usuario, actualizarUsuario } = useAuth();
  const toast = useToast();
  const [nombres, setNombres] = useState(usuario?.nombres ?? '');
  const [errorCampo, setErrorCampo] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!usuario) return null;
  const pro = usuario.plan === 'pro';

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setErrorCampo('');
    setErrorForm('');
    const limpios = nombres.trim().replace(/\s+/g, ' ');
    if (!limpios) {
      setErrorCampo('Ingresa tus nombres.');
      return;
    }
    setGuardando(true);
    try {
      // El estado se actualiza con la respuesta del PATCH (el JWT queda con el nombre anterior hasta el próximo login).
      const actualizado = await actualizarPerfil({ nombres: limpios });
      actualizarUsuario(actualizado);
      setNombres(actualizado.nombres);
      toast.mostrar('Datos actualizados');
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'VALIDACION' && err.campos?.nombres) setErrorCampo(err.campos.nombres);
      else setErrorForm(err instanceof ApiError ? err.message : 'No pudimos guardar los cambios. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="wrap page narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Perfil y membresía</h1>
        </div>
      </div>
      <div className="profile-grid">
        <section className="card">
          <h3>Datos del perfil</h3>
          <form className="stack" noValidate onSubmit={guardar}>
            <label className="f">
              Nombres
              <input
                type="text"
                name="nombres"
                required
                data-testid="perfil-nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                className={errorCampo ? 'invalid' : undefined}
                aria-invalid={errorCampo ? true : undefined}
              />
              <span className="field-err">{errorCampo}</span>
            </label>
            <label className="f">
              Correo electrónico
              <input type="email" value={usuario.email} disabled />
            </label>
            <p className="muted small" style={{ margin: 0 }}>
              Miembro desde el {fmtDay(usuario.creado_en)}
            </p>
            {errorForm && (
              <div className="form-error" role="alert">
                <Icon name="alert" />
                <span>{errorForm}</span>
              </div>
            )}
            <div>
              <button className="btn primary" type="submit" disabled={guardando} data-testid="perfil-guardar">
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Membresía</h3>
            <span className="chip st-pendiente">Pagos · próximamente</span>
          </div>
          <div className={`plan-box ${pro ? 'pro' : ''}`}>
            <p className="muted small" style={{ margin: '0 0 4px' }}>
              Plan actual
            </p>
            <h4>{pro ? 'ConsultaYa Pro' : 'Gratis'}</h4>
            <p className="muted small" style={{ margin: 0 }}>
              {pro ? 'S/ 24.90 al mes' : 'Acceso a la ruta completa, ejercicios y progreso.'}
            </p>
          </div>
          <p style={{ marginTop: 16 }}>
            <b>Mejora a Pro</b> por S/ 24.90 al mes y obtén:
          </p>
          <ul className="feat-list">
            {BENEFICIOS_PRO.map((f) => (
              <li key={f}>
                <Icon name="check" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button className="btn accent" type="button" disabled title="Próximamente" data-testid="mejorar-pro">
            <Icon name="star" /> Mejorar a Pro
          </button>
          <p className="muted small" style={{ marginTop: 8 }}>
            Próximamente.
          </p>
        </section>
      </div>
    </div>
  );
}
