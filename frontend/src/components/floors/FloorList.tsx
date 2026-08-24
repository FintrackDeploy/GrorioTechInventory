import type { FloorResponse } from "../../types/floor";

interface FloorListProps {
  floors: FloorResponse[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isAdmin: boolean;
  onCreate: () => void;
  onEdit: (floor: FloorResponse) => void;
  onDelete: (floor: FloorResponse) => void;
}

export function FloorList({
  floors,
  selectedId,
  onSelect,
  isAdmin,
  onCreate,
  onEdit,
  onDelete,
}: FloorListProps) {
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Этажи</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={onCreate}
            className="tag-mono rounded border border-line px-2 py-1 text-[11px] text-ink-soft transition-colors hover:border-brand hover:text-brand"
          >
            + Этаж
          </button>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto p-2">
        {floors.length === 0 && (
          <li className="px-2 py-4 text-center text-sm text-ink-faint">Этажей пока нет</li>
        )}
        {floors.map((floor) => {
          const isSelected = floor.id === selectedId;
          return (
            <li key={floor.id} className="group">
              <button
                type="button"
                onClick={() => onSelect(floor.id)}
                className={[
                  "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  isSelected ? "bg-brand-soft text-brand-strong" : "text-ink-soft hover:bg-neutral-soft",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={[
                      "tag-mono flex h-6 w-9 items-center justify-center rounded border text-[10px]",
                      isSelected ? "border-brand/40 bg-white text-brand" : "border-line text-ink-faint",
                    ].join(" ")}
                  >
                    №{floor.number}
                  </span>
                  <span className="truncate">{floor.name || `Этаж ${floor.number}`}</span>
                </span>
                <span className="tag-mono text-[11px] text-ink-faint">{floor.roomsCount}</span>
              </button>

              {isAdmin && (
                <div className="mt-0.5 hidden justify-end gap-2 px-3 pb-1 group-hover:flex">
                  <button
                    type="button"
                    onClick={() => onEdit(floor)}
                    className="text-[11px] text-ink-faint hover:text-brand"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(floor)}
                    className="text-[11px] text-ink-faint hover:text-danger"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
