# `data-testid` acordados con los e2e

Los e2e (Playwright, en `consultaya-deploy`) dependen de estos atributos. No los renombres sin avisar.

| `data-testid` | Dónde |
|---|---|
| `registro-nombres`, `registro-email`, `registro-password`, `registro-submit` | Formulario de registro |
| `login-email`, `login-password`, `login-submit` | Formulario de login |
| `form-error` | Cuadro de error del formulario de login y de registro («Credenciales inválidas», «ya está en uso») |
| `toast` | Aviso breve (existe solo mientras se muestra) |
| `modulo-<slug>` | Tarjeta de cada módulo en la ruta (`basico`, `intermedio`, `avanzado`); contiene las lecciones de ese módulo |
| `leccion-<slug>`, `leccion-estado-<slug>`, `leccion-abrir-<slug>` | Fila, estado y botón de cada lección. `leccion-abrir-<slug>` navega a `#/leccion/<slug>` |
| `seccion` | Cada sección de una lección |
| `ejemplo-resultado` | Tabla de resultado de cada ejemplo de la lección |
| `ir-ejercicios` | Botón «Ir a los ejercicios» de la lección |
| `editor` | Contenedor del editor SQL; dentro hay un `<textarea>` (se escribe con `fill()`) |
| `ejecutar`, `enviar` | Botones del ejercicio y del modo libre (`ejecutar`) |
| `resultado` | Bloque «Resultado de tu consulta» |
| `feedback-ok`, `feedback-error` | Respuesta correcta («¡Respuesta correcta!») / incorrecta («Todavía no es correcto») |
| `sql-error` | Error de la consulta explicado en español (sintaxis, solo SELECT, etc.) |
| `ex-tab-<id>` | Pestaña de cada ejercicio; lleva `data-estado="completado"` o `"pendiente"` |
| `progreso-vacio`, `progreso-empezar` | «Aún no tienes avance» y su botón |
| `progreso-modulo-<slug>` | Tarjeta de cada módulo en «Mi progreso» (porcentaje) |
| `progreso-completado-<ejercicio_id>` | Fila de cada ejercicio completado (con su fecha) |

Otros usados en los tests del repo: `menu-usuario`, `cerrar-sesion`, `dashboard-continuar`, `logro-<nombre>`, `siguiente`, `salida`, `ejercicio-completado`, `error-guardar`, `error-carga`, `perfil-nombres`, `perfil-guardar`, `mejorar-pro`, `cuentas-prueba` (solo en desarrollo), `enunciado`, `esquema`.
