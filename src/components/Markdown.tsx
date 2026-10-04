import ReactMarkdown from 'react-markdown';

/** Markdown del contenido (enunciados, lecciones). Sin HTML crudo; las tablas usan el estilo `ops` del prototipo. */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown components={{ table: (props) => <table className="ops" {...props} /> }}>{children}</ReactMarkdown>
  );
}
