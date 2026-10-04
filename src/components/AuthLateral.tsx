import { Icon } from './Icon';
import { CodigoSql } from './CodigoSql';

/** Panel verde a la derecha de login y registro. */
export function AuthLateral() {
  return (
    <aside className="auth-side">
      <p className="eyebrow" style={{ color: '#BFE7DC' }}>
        ConsultaYa
      </p>
      <h2>Practica SQL con datos que conoces.</h2>
      <CodigoSql sql={"SELECT nombre, precio\nFROM productos\nWHERE categoria = 'Bebidas';"} />
      <ul>
        <li>
          <Icon name="check" /> Lecciones cortas en español
        </li>
        <li>
          <Icon name="check" /> Ejercicios con validación automática
        </li>
        <li>
          <Icon name="check" /> Tu avance se guarda entre sesiones
        </li>
      </ul>
    </aside>
  );
}
