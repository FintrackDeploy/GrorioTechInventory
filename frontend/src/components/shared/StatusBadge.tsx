import type { MapStatus } from "../../types/room";

const STATUS_CONFIG: Record<MapStatus, { label: string; className: string }> = {
  OK: { label: "Норма", className: "bg-ok-soft text-ok border-ok/30" },
  WARNING: { label: "Внимание", className: "bg-warn-soft text-warn border-warn/30" },
  CRITICAL: { label: "Критично", className: "bg-danger-soft text-danger border-danger/30" },
  EMPTY: { label: "Пусто", className: "bg-neutral-soft text-neutral border-neutral/30" },
};

export function StatusBadge({ status }: { status: MapStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`tag-mono inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function statusDotColor(status: MapStatus): string {
  switch (status) {
    case "OK":
      return "var(--color-ok)";
    case "WARNING":
      return "var(--color-warn)";
    case "CRITICAL":
      return "var(--color-danger)";
    default:
      return "var(--color-neutral)";
  }
}
