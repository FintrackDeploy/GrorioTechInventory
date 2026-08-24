import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS, EQUIPMENT_TYPE_GROUPS } from "../../types/equipment";
import type { EquipmentStatus, EquipmentType } from "../../types/equipment";
import type { RoomResponse } from "../../types/room";
import type { EmployeeResponse } from "../../types/employee";
import type { EquipmentFilters } from "../../api/equipmentApi";

interface EquipmentFilterBarProps {
  filters: EquipmentFilters;
  onChange: (filters: EquipmentFilters) => void;
  rooms: RoomResponse[];
  employees: EmployeeResponse[];
}

const STATUSES = Object.keys(EQUIPMENT_STATUS_LABELS) as EquipmentStatus[];

const selectClass =
  "rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand";

export function EquipmentFilterBar({ filters, onChange, rooms, employees }: EquipmentFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
      <input
        type="text"
        value={filters.q ?? ""}
        onChange={(e) => onChange({ ...filters, q: e.target.value })}
        placeholder="Поиск: инв. номер, IP, MAC, CPU…"
        className="min-w-[220px] flex-1 rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
      />

      <select
        value={filters.status ?? ""}
        onChange={(e) =>
          onChange({ ...filters, status: (e.target.value || null) as EquipmentStatus | null })
        }
        className={selectClass}
      >
        <option value="">Любой статус</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {EQUIPMENT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={filters.type ?? ""}
        onChange={(e) =>
          onChange({ ...filters, type: (e.target.value || null) as EquipmentType | null })
        }
        className={selectClass}
      >
        <option value="">Любой тип</option>
        {EQUIPMENT_TYPE_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.types.map((t) => (
              <option key={t} value={t}>
                {EQUIPMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        value={filters.roomId ?? ""}
        onChange={(e) =>
          onChange({ ...filters, roomId: e.target.value ? Number(e.target.value) : null })
        }
        className={selectClass}
      >
        <option value="">Любой кабинет</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.number} {r.floorNumber != null ? `(эт. ${r.floorNumber})` : ""}
          </option>
        ))}
      </select>

      <select
        value={filters.employeeId ?? ""}
        onChange={(e) =>
          onChange({ ...filters, employeeId: e.target.value ? Number(e.target.value) : null })
        }
        className={selectClass}
      >
        <option value="">Любой сотрудник</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.fullName}
          </option>
        ))}
      </select>

      {/* Сброс фильтров */}
      {(filters.q || filters.status || filters.type || filters.roomId || filters.employeeId) && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-soft hover:border-danger/40 hover:text-danger"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}