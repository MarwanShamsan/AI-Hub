import type { ReactNode } from "react";

type PageSectionProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function PageSection({
  title,
  description,
  children
}: PageSectionProps) {
  return (
    <section className="page-section">
      <header className="page-header">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="page-body">{children}</div>
    </section>
  );
}
