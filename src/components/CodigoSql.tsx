import { hl } from '../sql/formato';

interface Props {
  sql: string;
  className?: string;
}

/** Bloque de código SQL con resaltado (el HTML sale de `hl`, que escapa el texto). */
export function CodigoSql({ sql, className = 'code' }: Props) {
  return <pre className={className} dangerouslySetInnerHTML={{ __html: hl(sql) }} />;
}
