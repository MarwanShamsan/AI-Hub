import type { Timer } from "../../types/api";
import { useI18n } from "../../i18n/useI18n";

export function TimerCard({ timer }: { timer: Timer | null }) {
  const { t, locale } = useI18n();

  return (
    <div className="deal-timer-card">
      <div className="deal-timer-header">
        <h3 className="deal-timer-title">{t("deals.timer.title")}</h3>
      </div>

      {!timer ? (
        <div className="deal-timer-empty">
          {t("deals.timer.noProjection")}
        </div>
      ) : (
        <div className="deal-timer-grid">
          <TimerRow
            label={t("deals.timer.state")}
            value={timer.state || t("common.notAvailable")}
            highlight
          />
          <TimerRow
            label={t("deals.timer.startedAt")}
            value={formatDateTime(timer.started_at, locale)}
          />
          <TimerRow
            label={t("deals.timer.expiresAt")}
            value={formatDateTime(timer.expires_at, locale)}
          />
          <TimerRow
            label={t("deals.timer.expiredAt")}
            value={formatDateTime(timer.expired_at, locale)}
          />
          <TimerRow
            label={t("deals.timer.updatedAt")}
            value={formatDateTime(timer.updated_at, locale)}
          />
        </div>
      )}
    </div>
  );
}

function TimerRow({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`deal-timer-row ${highlight ? "deal-timer-row-highlight" : ""}`}>
      <span className="deal-timer-label">{label}</span>
      <span className="deal-timer-value">{value}</span>
    </div>
  );
}

function formatDateTime(value: string | null | undefined, locale: "ar" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
}