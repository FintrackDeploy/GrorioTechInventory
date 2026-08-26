interface EquipmentToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  categories: string[];
  active: string;
  setActive: (value: string) => void;
}

export default function EquipmentToolbar({
  search,
  setSearch,
  categories,
  active,
  setActive,
}: EquipmentToolbarProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-ink-faint"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Поиск оборудования..."
            className="w-full rounded-xl border border-line bg-white py-3 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/10"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-ink-faint transition hover:bg-neutral-soft hover:text-ink"
              aria-label="Очистить поиск"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories */}
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            Категория
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActive("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active === "all"
                  ? "bg-brand text-white"
                  : "border border-line bg-neutral-soft text-ink-soft hover:border-brand/30 hover:text-brand"
              }`}
            >
              Всё
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setActive(category)
                }
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active === category
                    ? "bg-brand text-white"
                    : "border border-line bg-neutral-soft text-ink-soft hover:border-brand/30 hover:text-brand"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}