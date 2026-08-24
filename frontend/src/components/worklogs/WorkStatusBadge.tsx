import type { WorkStatus } from "../../types/worklog";
import { WORK_STATUS_LABELS } from "../../types/worklog";

const STATUS_CLASSES: Record<WorkStatus, string> = {
  OPEN: "bg-warn-soft text-warn border-warn/30",
  IN_PROGRESS: "bg-brand-soft text-brand-strong border-brand/30",
  CLOSED: "bg-ok-soft text-ok border-ok/30",
};

export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  return (
    <span
      className={`tag-mono inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_CLASSES[status]}`}
    >
      {WORK_STATUS_LABELS[status]}
    </span>
  );
}
