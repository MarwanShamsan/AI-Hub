type Tone = "neutral" | "warning" | "danger" | "success";

type Props = {
  label: string;
  tone?: Tone;
};

function getClassName(tone: Tone) {
  switch (tone) {
    case "danger":
      return "deal-badge deal-badge-danger";
    case "success":
      return "deal-badge deal-badge-success";
    case "warning":
      return "deal-badge deal-badge-neutral";
    default:
      return "deal-badge deal-badge-neutral";
  }
}

export function StatusBadge({ label, tone = "neutral" }: Props) {
  return <span className={getClassName(tone)}>{label}</span>;
}