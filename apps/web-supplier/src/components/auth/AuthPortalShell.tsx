import type {
  ReactNode
} from "react";

import AuthBrandMark from "./AuthBrandMark";

type AuthPortalShellProps = {
  children: ReactNode;

  portalLabel: string;
  title: string;
  description: string;
  points: readonly string[];

  landingUrl: string;
  backLabel: string;

  switchPortalUrl: string;
  switchPortalLabel: string;
};

export default function AuthPortalShell({
  children,
  portalLabel,
  title,
  description,
  points,
  landingUrl,
  backLabel,
  switchPortalUrl,
  switchPortalLabel
}: AuthPortalShellProps) {
  return (
    <div className="lux-auth-shell">
      <div
        className="lux-auth-background-grid"
        aria-hidden="true"
      />

      <div
        className="lux-auth-background-glow"
        aria-hidden="true"
      />

      <header className="lux-auth-topbar">
        <a
          className="lux-auth-brand"
          href={landingUrl}
          aria-label="AI Hub"
        >
          <AuthBrandMark />

          <span className="lux-auth-brand__text">
            <strong>AI Hub</strong>

            <small>
              Autonomous Infrastructure
            </small>
          </span>
        </a>

        <a
          className="lux-auth-back"
          href={landingUrl}
        >
          <span
            className="lux-auth-back__arrow"
            aria-hidden="true"
          >
            ←
          </span>

          {backLabel}
        </a>
      </header>

      <main className="lux-auth-main">
        <aside className="lux-auth-story">
          <div
            className="lux-auth-story__orb"
            aria-hidden="true"
          />

          <div className="lux-auth-story__content">
            <span className="lux-auth-story__eyebrow">
              {portalLabel}
            </span>

            <h2>{title}</h2>

            <p>{description}</p>

            <ul>
              {points.map((point) => (
                <li key={point}>
                  <span aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="lux-auth-story__law">
            <div>
              <strong>168h</strong>
              <span>
                Sovereign Time
              </span>
            </div>

            <p>
              Evidence · Authority · Finality
            </p>
          </div>
        </aside>

        <section className="lux-auth-form-panel">
          <div className="lux-auth-form-panel__inner">
            {children}
          </div>

          <div className="lux-auth-switch">
            <span
              className="lux-auth-switch__line"
              aria-hidden="true"
            />

            <a href={switchPortalUrl}>
              {switchPortalLabel}
            </a>

            <span
              className="lux-auth-switch__line"
              aria-hidden="true"
            />
          </div>
        </section>
      </main>
    </div>
  );
}