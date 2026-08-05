import { ReactNode } from "react";

type BannerTone =
  | "neutral"
  | "info"
  | "warning"
  | "danger"
  | "success";

type Props = {
  title: string;
  text: string;
  tone?: BannerTone;
  action?: ReactNode;
};

function getToneStyles(tone: BannerTone) {
  switch (tone) {
    case "info":
      return {
        borderColor:
          "rgba(2, 132, 199, 0.22)",
        background: "#f0f9ff",
        color: "#0369a1"
      };

    case "warning":
      return {
        borderColor:
          "rgba(180, 83, 9, 0.22)",
        background: "#fffaf0",
        color: "#92400e"
      };

    case "danger":
      return {
        borderColor:
          "rgba(185, 28, 28, 0.22)",
        background: "#fff5f5",
        color: "#b91c1c"
      };

    case "success":
      return {
        borderColor:
          "rgba(21, 128, 61, 0.22)",
        background: "#f0fff4",
        color: "#15803d"
      };

    default:
      return {
        borderColor:
          "var(--border-soft)",
        background:
          "rgba(255, 255, 255, 0.92)",
        color:
          "var(--text-primary)"
      };
  }
}

export function InfoBanner({ title, text, tone = "neutral", action }: Props) {
  const toneStyles = getToneStyles(tone);

  return (
    <div
      style={{
        border: "1px solid",
        borderRadius: 18,
        padding: 18,
        display: "grid",
        gap: 10,
        ...toneStyles
      }}
    >
      <div>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
        <div style={{ color: "inherit" }}>{text}</div>
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}