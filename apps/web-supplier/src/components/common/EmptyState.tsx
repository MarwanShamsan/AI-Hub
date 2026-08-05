type Props = {
  title: string;
  text: string;
};

export function EmptyState({ title, text }: Props) {
  return (
    <div className="dashboard-empty">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div className="muted">{text}</div>
    </div>
  );
}