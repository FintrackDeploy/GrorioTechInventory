import type { EquipmentStatus } from "../../types/equipment";
import { EQUIPMENT_STATUS_LABELS } from "../../types/equipment";

const STATUS_CLASSES: Record<EquipmentStatus, string> = {
  IN_USE: "bg-ok-soft text-ok border-ok/30",
  REPAIR: "bg-warn-soft text-warn border-warn/30",
  STORAGE: "bg-neutral-soft text-neutral border-neutral/30",
  WRITTEN_OFF: "bg-danger-soft text-danger border-danger/30",
};

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span
      className={`tag-mono inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_CLASSES[status]}`}
    >
      {EQUIPMENT_STATUS_LABELS[status]}
    </span>
  );
}
