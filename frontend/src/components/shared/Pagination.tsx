interface PaginationProps {
  page: number; // с 0
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Генерируем номера страниц для показа (макс 7)
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 3) pages.push("…");
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 4) pages.push("…");
    pages.push(totalPages - 1);
  }

  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3">
      <span className="tag-mono text-xs text-ink-faint">
        Всего: {totalElements.toLocaleString("ru-RU")}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
          aria-label="Предыдущая страница"
        >
          ‹
        </button>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`dots-${idx}`} className="px-1 text-sm text-ink-faint">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={[
                "flex h-7 min-w-[28px] items-center justify-center rounded border px-1.5 text-xs transition-colors",
                p === page
                  ? "border-brand bg-brand text-white"
                  : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
              ].join(" ")}
            >
              {(p as number) + 1}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
          aria-label="Следующая страница"
        >
          ›
        </button>
      </div>
    </div>
  );
}