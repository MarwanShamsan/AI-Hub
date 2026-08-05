import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export function PageHero({ title, subtitle, actions }: Props) {
  return (
    <section className="dashboard-topbar">
      <div>
        <h1 className="dashboard-title">{title}</h1>
        <p className="dashboard-subtitle">{subtitle}</p>
      </div>

      {actions ? <div className="dashboard-topbar-actions">{actions}</div> : null}
    </section>
  );
}