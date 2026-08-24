interface StatTileProps {
  label: string;
  value: number | string;
  accent?: "brand" | "ok" | "warn" | "danger" | "neutral";
}

const ACCENT_CLASSES: Record<NonNullable<StatTileProps["accent"]>, string> = {
  brand: "text-brand-strong",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  neutral: "text-ink",
};

export function StatTile({ label, value, accent = "neutral" }: StatTileProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="tag-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">{label}</div>
      <div className={`tag-mono mt-1.5 text-2xl font-semibold ${ACCENT_CLASSES[accent]}`}>{value}</div>
    </div>
  );
}
