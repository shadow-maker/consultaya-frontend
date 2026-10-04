import { HashRouter } from 'react-router';
import { Proveedores } from './Proveedores';
import { Rutas } from './Rutas';

export default function App() {
  return (
    <HashRouter>
      <Proveedores>
        <Rutas />
      </Proveedores>
    </HashRouter>
  );
}
