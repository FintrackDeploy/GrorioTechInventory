import type { DepartmentSummary } from "../../types/employee";

interface DepartmentSidebarProps {
  departments: DepartmentSummary[];
  selectedDepartment: string | null;
  onSelect: (department: string | null) => void;
  totalCount: number;
}

export function DepartmentSidebar({
  departments,
  selectedDepartment,
  onSelect,
  totalCount,
}: DepartmentSidebarProps) {
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Отделы</h2>
      </div>

      <ul className="flex-1 overflow-y-auto p-2">
        <li>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={[
              "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
              selectedDepartment === null ? "bg-brand-soft text-brand-strong" : "text-ink-soft hover:bg-neutral-soft",
            ].join(" ")}
          >
            <span>Все отделы</span>
            <span className="tag-mono text-[11px] text-ink-faint">{totalCount}</span>
          </button>
        </li>

        {departments.map((d) => {
          const isSelected = d.department === selectedDepartment;
          return (
            <li key={d.department}>
              <button
                type="button"
                onClick={() => onSelect(d.department)}
                className={[
                  "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  isSelected ? "bg-brand-soft text-brand-strong" : "text-ink-soft hover:bg-neutral-soft",
                ].join(" ")}
              >
                <span className="truncate">{d.department}</span>
                <span className="tag-mono text-[11px] text-ink-faint">{d.employeesCount}</span>
              </button>
            </li>
          );
        })}

        {departments.length === 0 && (
          <li className="px-2 py-4 text-center text-sm text-ink-faint">Отделы не заданы</li>
        )}
      </ul>
    </div>
  );
}