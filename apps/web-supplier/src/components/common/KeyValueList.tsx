type Item = {
  label: string;
  value: string;
};

type Props = {
  items: Item[];
};

export function KeyValueList({ items }: Props) {
  return (
    <div className="deal-summary-list">
      {items.map((item) => (
        <div key={item.label} className="deal-summary-row">
          <div className="deal-summary-label">{item.label}</div>
          <div className="deal-summary-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}