interface EquipmentStatsItem {
  title: string;
  value: number;
}

interface EquipmentStatsProps {
  items: EquipmentStatsItem[];
}

export default function EquipmentStats({
  items,
}: EquipmentStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-sm"
        >
          <div className="text-xs font-medium text-ink-faint">
            {item.title}
          </div>

          <div className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}