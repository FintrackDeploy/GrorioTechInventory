import { useMemo, useState } from "react";
import EquipmentCard from "./EquipmentCard";

interface EquipmentCategoryListProps {
  items: any[];
  canEdit?: boolean;
  isAdmin?: boolean;
  statusUpdatingId?: number | null;

  onStatusChange?: (
    item: any,
    status: any,
  ) => void;

  onEdit?: (item: any) => void;

  onDelete?: (item: any) => void;

  onViewGroup?: (
    inventoryNumber: string,
  ) => void;

  specSummary?: (
    item: any,
  ) => string;
}

interface Category {
  name: string;
  items: any[];
}

export default function EquipmentCategoryList({
  items,
  canEdit = false,
  isAdmin = false,
  statusUpdatingId = null,
  onStatusChange,
  onEdit,
  onDelete,
  onViewGroup,
  specSummary,
}: EquipmentCategoryListProps) {
  const categories = useMemo(() => {
    const map = new Map<
      string,
      any[]
    >();

    items.forEach((item) => {
      const category =
        item.category ||
        "Другое";

      if (!map.has(category)) {
        map.set(category, []);
      }

      map.get(category)!.push(item);
    });

    return Array.from(
      map.entries(),
    ).map(
      ([name, categoryItems]) => ({
        name,
        items: categoryItems,
      }),
    );
  }, [items]);

  const [openCategories, setOpenCategories] =
    useState<Set<string>>(
      () =>
        new Set(
          categories.map(
            (category) =>
              category.name,
          ),
        ),
    );

  function toggleCategory(
    name: string,
  ) {
    setOpenCategories((previous) => {
      const next = new Set(
        previous,
      );

      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      return next;
    });
  }

  function openAll() {
    setOpenCategories(
      new Set(
        categories.map(
          (category) =>
            category.name,
        ),
      ),
    );
  }

  function closeAll() {
    setOpenCategories(
      new Set(),
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Управление группами */}
      {categories.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-ink-faint">
            Категорий:{" "}
            <span className="font-semibold text-ink-soft">
              {categories.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAll}
              className="text-xs font-medium text-ink-faint transition hover:text-brand"
            >
              Развернуть всё
            </button>

            <button
              type="button"
              onClick={closeAll}
              className="text-xs font-medium text-ink-faint transition hover:text-brand"
            >
              Свернуть всё
            </button>
          </div>
        </div>
      )}

      {categories.map(
        (category) => {
          const isOpen =
            openCategories.has(
              category.name,
            );

          return (
            <section
              key={category.name}
              className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
            >
              {/* Заголовок категории */}
              <button
                type="button"
                onClick={() =>
                  toggleCategory(
                    category.name,
                  )
                }
                className="group flex w-full items-center justify-between gap-4 border-b border-line px-5 py-4 text-left transition hover:bg-neutral-soft/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Стрелка без lucide */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-soft text-sm text-ink-soft transition-transform ${
                      isOpen
                        ? "rotate-90"
                        : ""
                    }`}
                    aria-hidden="true"
                  >
                    ›
                  </span>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-ink">
                      {category.name}
                    </h2>

                    <p className="mt-0.5 text-xs text-ink-faint">
                      {category.items.length}{" "}
                      {getEquipmentWord(
                        category.items.length,
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition ${
                    isOpen
                      ? "bg-brand text-white"
                      : "bg-brand-soft text-brand-strong"
                  }`}
                >
                  {category.items.length}
                </span>
              </button>

              {/* Содержимое категории */}
              {isOpen && (
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {category.items.map(
                      (item) => (
                        <EquipmentCard
                          key={
                            item.id ??
                            item.inventoryNumber
                          }
                          equipment={item}
                          canEdit={
                            canEdit
                          }
                          isAdmin={
                            isAdmin
                          }
                          statusUpdatingId={
                            statusUpdatingId
                          }
                          onStatusChange={
                            onStatusChange
                          }
                          onEdit={
                            onEdit
                          }
                          onDelete={
                            onDelete
                          }
                          specSummary={
                            specSummary
                          }
                        />
                      ),
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        },
      )}
    </div>
  );
}

function getEquipmentWord(
  count: number,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return "единица";
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 10 ||
      mod100 >= 20)
  ) {
    return "единицы";
  }

  return "единиц";
}