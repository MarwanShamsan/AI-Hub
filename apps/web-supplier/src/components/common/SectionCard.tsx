import { PropsWithChildren, ReactNode } from "react";

type Props = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}>;

export function SectionCard({ title, subtitle, action, className, children }: Props) {
  return (
    <section className={className ?? "dashboard-panel"}>
      {(title || subtitle || action) ? (
        <div className="dashboard-panel-header">
          <div>
            {title ? <h3 className="dashboard-panel-title">{title}</h3> : null}
            {subtitle ? <p className="dashboard-panel-subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}