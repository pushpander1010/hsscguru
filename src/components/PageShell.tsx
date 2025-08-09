// src/components/PageShell.tsx
type Props = { title?: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode };

export default function PageShell({ title, subtitle, actions, children }: Props) {
  return (
    <div className="page">
      {(title || subtitle || actions) && (
        <div className="header flex items-start justify-between gap-3">
          <div>
            {title && <h1 className="title">{title}</h1>}
            {subtitle && <p className="muted mt-2">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}