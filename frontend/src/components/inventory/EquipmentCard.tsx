import type {
  EquipmentResponse,
  EquipmentStatus,
} from "../../types/equipment";

import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from "../../types/equipment";

interface EquipmentCardProps {
  equipment: EquipmentResponse;
  canEdit?: boolean;
  isAdmin?: boolean;
  statusUpdatingId?: number | null;
  onStatusChange?: (
    item: EquipmentResponse,
    status: EquipmentStatus,
  ) => void;
  onEdit?: (item: EquipmentResponse) => void;
  onDelete?: (item: EquipmentResponse) => void;
  specSummary?: (
    item: EquipmentResponse,
  ) => string;
}

const STATUS_CLASSES: Record<
  string,
  string
> = {
  IN_USE:
    "bg-green-100 text-green-700",
  STORAGE:
    "bg-blue-100 text-blue-700",
  REPAIR:
    "bg-red-100 text-red-700",
  WRITTEN_OFF:
    "bg-gray-100 text-gray-600",
};

function getIcon(type: string) {
  switch (type) {
    case "COMPUTER":
    case "LAPTOP":
    case "THIN_CLIENT":
    case "SERVER":
      return "▣";

    case "MONITOR":
      return "▭";

    case "PRINTER":
    case "MFP":
      return "▤";

    case "SCANNER":
      return "▥";

    case "SWITCH":
    case "ROUTER":
    case "ACCESS_POINT":
      return "◇";

    case "PHONE":
    case "TABLET":
      return "▯";

    case "KEYBOARD":
      return "⌨";

    case "MOUSE":
      return "◉";

    case "PROJECTOR":
      return "◫";

    case "UPS":
      return "▰";

    default:
      return "□";
  }
}

export default function EquipmentCard({
  equipment,
  canEdit = false,
  isAdmin = false,
  statusUpdatingId = null,
  onStatusChange,
  onEdit,
  onDelete,
  specSummary,
}: EquipmentCardProps) {
  const statusClass =
    STATUS_CLASSES[
      equipment.status
    ] ??
    "bg-gray-100 text-gray-600";

  const summary =
    specSummary?.(equipment) ??
    equipment.notes ??
    "Характеристики не указаны";

  const isUpdating =
    statusUpdatingId ===
    equipment.id;

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg font-semibold text-brand-strong">
            {getIcon(equipment.type)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink">
                  {EQUIPMENT_TYPE_LABELS[
                    equipment.type
                  ] ??
                    equipment.type}
                </h3>

                <div className="mt-1 text-[11px] text-ink-faint">
                  ID #{equipment.id}
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass}`}
              >
                {EQUIPMENT_STATUS_LABELS[
                  equipment.status
                ] ??
                  equipment.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-neutral-soft p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
            Инвентарный номер
          </div>

          <div className="mt-1 font-mono text-sm font-semibold text-ink">
            {equipment.inventoryNumber}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-start justify-between gap-3 text-xs">
            <span className="text-ink-faint">
              Кабинет
            </span>

            <span className="text-right font-medium text-ink-soft">
              {equipment.roomNumber ||
                "Не указан"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 text-xs">
            <span className="text-ink-faint">
              Ответственный
            </span>

            <span className="max-w-[65%] truncate text-right font-medium text-ink-soft">
              {equipment.responsibleEmployeeName ||
                "Не назначен"}
            </span>
          </div>

          <div className="border-t border-line pt-2 text-xs leading-5 text-ink-soft">
            {summary}
          </div>

          {equipment.ipAddress && (
            <div className="font-mono text-[10px] text-ink-faint">
              IP: {equipment.ipAddress}
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center justify-between border-t border-line bg-neutral-soft/30 px-4 py-2.5">
          {onStatusChange ? (
            <select
              value={equipment.status}
              disabled={isUpdating}
              onChange={(event) =>
                onStatusChange(
                  equipment,
                  event.target
                    .value as EquipmentStatus,
                )
              }
              className="rounded-md border border-line bg-white px-2 py-1.5 text-[11px] text-ink-soft outline-none focus:border-brand disabled:opacity-50"
            >
              {Object.entries(
                EQUIPMENT_STATUS_LABELS,
              ).map(
                ([status, label]) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={() =>
                  onEdit(equipment)
                }
                className="text-xs font-medium text-ink-faint hover:text-brand"
              >
                Изменить
              </button>
            )}

            {isAdmin && onDelete && (
              <button
                type="button"
                onClick={() =>
                  onDelete(equipment)
                }
                className="text-xs font-medium text-ink-faint hover:text-danger"
              >
                Удалить
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}