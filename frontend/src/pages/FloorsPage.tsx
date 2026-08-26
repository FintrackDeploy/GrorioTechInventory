import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppShell } from "../components/layout/AppShell";
import { FloorFormModal } from "../components/floors/FloorFormModal";
import { FloorMapView } from "../components/floors/FloorMapView";

import { useAuth } from "../context/AuthContext";

import {
  createFloor,
  deleteFloor,
  fetchFloors,
  updateFloor,
} from "../api/floorApi";

import { extractApiErrorMessage } from "../api/client";

import type {
  FloorRequest,
  FloorResponse,
} from "../types/floor";

function getFloorTitle(
  floor: FloorResponse,
): string {
  return (
    floor.name ||
    `Этаж ${floor.number}`
  );
}

function getRoomWord(
  count: number,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return "кабинет";
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 10 ||
      mod100 >= 20)
  ) {
    return "кабинета";
  }

  return "кабинетов";
}

function getFloorLabel(
  number: number,
): string {
  if (number === 0) {
    return "Цоколь";
  }

  if (number < 0) {
    return `Подвал ${Math.abs(number)}`;
  }

  return `${number} этаж`;
}

export function FloorsPage() {
  const { user } =
    useAuth();

  const isAdmin =
    user?.role === "ADMIN";

  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "ENGINEER";

  const [
    floors,
    setFloors,
  ] = useState<FloorResponse[]>(
    [],
  );

  const [
    selectedId,
    setSelectedId,
  ] = useState<number | null>(
    null,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<string | null>(
    null,
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    editingFloor,
    setEditingFloor,
  ] = useState<FloorResponse | null>(
    null,
  );

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  async function loadFloors(
    preserveSelection = true,
  ) {
    try {
      setLoadError(null);

      const data =
        await fetchFloors();

      setFloors(data);

      if (
        !preserveSelection ||
        (
          selectedId !== null &&
          !data.some(
            (floor) =>
              floor.id ===
              selectedId,
          )
        )
      ) {
        setSelectedId(
          data[0]?.id ?? null,
        );
      } else if (
        selectedId === null &&
        data.length > 0
      ) {
        setSelectedId(
          data[0].id,
        );
      }
    } catch (err) {
      setLoadError(
        extractApiErrorMessage(
          err,
          "Не удалось загрузить список этажей",
        ),
      );
    }
  }

  useEffect(() => {
    setIsLoading(true);

    loadFloors(false).finally(
      () => setIsLoading(false),
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(
    payload: FloorRequest,
  ) {
    const created =
      await createFloor(
        payload,
      );

    await loadFloors();

    setSelectedId(
      created.id,
    );
  }

  async function handleUpdate(
    payload: FloorRequest,
  ) {
    if (!editingFloor) {
      return;
    }

    await updateFloor(
      editingFloor.id,
      payload,
    );

    setEditingFloor(null);

    await loadFloors();
  }

  async function handleDelete(
    floor: FloorResponse,
  ) {
    const confirmed =
      window.confirm(
        `Удалить этаж №${floor.number}${
          floor.name
            ? ` (${floor.name})`
            : ""
        }?

Все кабинеты этажа тоже будут удалены.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteFloor(
        floor.id,
      );

      await loadFloors(false);
    } catch (err) {
      window.alert(
        extractApiErrorMessage(
          err,
          "Не удалось удалить этаж",
        ),
      );
    }
  }

  const filteredFloors =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return floors;
      }

      return floors.filter(
        (floor) => {
          const title =
            getFloorTitle(
              floor,
            ).toLowerCase();

          const number =
            String(
              floor.number,
            );

          return (
            title.includes(
              query,
            ) ||
            number.includes(
              query,
            )
          );
        },
      );
    }, [floors, search]);

  const selectedFloor =
    floors.find(
      (floor) =>
        floor.id ===
        selectedId,
    ) ?? null;

  const totalRooms =
    floors.reduce(
      (sum, floor) =>
        sum +
        (floor.roomsCount ||
          0),
      0,
    );

  const floorsWithRooms =
    floors.filter(
      (floor) =>
        floor.roomsCount >
        0,
    ).length;

  const averageRooms =
    floors.length > 0
      ? Math.round(
          totalRooms /
            floors.length,
        )
      : 0;

  return (
    <AppShell title="Этажи и планы">
      <div className="space-y-5">
        {/* ============================================
            HEADER
        ============================================= */}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
              Инфраструктура
            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Этажи и планы
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-soft">
              Управление этажами,
              кабинетами и
              интерактивными планами
              помещений.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                setIsCreating(
                  true,
                )
              }
              className="
                self-start
                rounded-xl
                bg-brand
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                shadow-sm
                transition
                hover:bg-brand-strong
                xl:self-auto
              "
            >
              + Добавить этаж
            </button>
          )}
        </div>

        {/* ============================================
            STATS
        ============================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Всего этажей
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ink">
              {floors.length}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              в здании
            </div>
          </div>

          <div className="rounded-2xl border border-brand/20 bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Кабинеты
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-brand-strong">
              {totalRooms}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              всего помещений
            </div>
          </div>

          <div className="rounded-2xl border border-ok/20 bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Заполненные этажи
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ok">
              {floorsWithRooms}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              имеют кабинеты
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Среднее
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ink">
              {averageRooms}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              кабинетов на этаж
            </div>
          </div>
        </div>

        {/* ============================================
            ERROR
        ============================================= */}

        {loadError && (
          <div className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-danger">
              {loadError}
            </div>

            <button
              type="button"
              onClick={() =>
                loadFloors(
                  true,
                )
              }
              className="self-start rounded-lg border border-danger/20 bg-surface px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/5 sm:self-auto"
            >
              Повторить
            </button>
          </div>
        )}

        {/* ============================================
            MAIN
        ============================================= */}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="h-[560px] animate-pulse rounded-2xl border border-line bg-surface" />

            <div className="h-[560px] animate-pulse rounded-2xl border border-line bg-surface" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            {/* ========================================
                FLOOR NAVIGATION
            ========================================= */}

            <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm xl:max-h-[calc(100vh-250px)]">
              <div className="border-b border-line p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      Этажи
                    </div>

                    <div className="mt-0.5 text-xs text-ink-faint">
                      {filteredFloors.length} из{" "}
                      {floors.length}
                    </div>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft font-mono text-xs font-semibold text-brand">
                    {floors.length}
                  </div>
                </div>

                {/* SEARCH */}

                <div className="relative mt-4">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Поиск этажа…"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-line
                      bg-canvas
                      py-2.5
                      pl-8
                      pr-3
                      text-sm
                      text-ink
                      outline-none
                      transition
                      placeholder:text-ink-faint
                      focus:border-brand
                      focus:ring-2
                      focus:ring-brand/10
                    "
                  />
                </div>
              </div>

              {/* FLOOR LIST */}

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {filteredFloors.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center">
                    <div className="text-2xl text-ink-faint">
                      ⌕
                    </div>

                    <div className="mt-2 text-sm font-medium text-ink">
                      Ничего не найдено
                    </div>

                    <div className="mt-1 text-xs text-ink-faint">
                      Попробуйте изменить
                      поисковый запрос.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFloors.map(
                      (floor) => {
                        const isSelected =
                          floor.id ===
                          selectedId;

                        return (
                          <div
                            key={
                              floor.id
                            }
                            className={[
                              "group rounded-xl border transition-all",
                              isSelected
                                ? "border-brand/30 bg-brand-soft shadow-sm"
                                : "border-transparent hover:border-line hover:bg-neutral-soft",
                            ].join(
                              " ",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedId(
                                  floor.id,
                                )
                              }
                              className="w-full p-3 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={[
                                    "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border",
                                    isSelected
                                      ? "border-brand/30 bg-surface text-brand"
                                      : "border-line bg-surface text-ink-faint",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  <span className="text-[8px] font-semibold uppercase tracking-wide">
                                    Этаж
                                  </span>

                                  <span className="font-mono text-sm font-semibold">
                                    {
                                      floor.number
                                    }
                                  </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div
                                    className={[
                                      "truncate text-sm font-semibold",
                                      isSelected
                                        ? "text-brand-strong"
                                        : "text-ink",
                                    ].join(
                                      " ",
                                    )}
                                  >
                                    {
                                      getFloorTitle(
                                        floor,
                                      )
                                    }
                                  </div>

                                  <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-faint">
                                    <span>
                                      {
                                        floor.roomsCount
                                      }{" "}
                                      {getRoomWord(
                                        floor.roomsCount,
                                      )}
                                    </span>

                                    <span>
                                      ·
                                    </span>

                                    <span>
                                      {
                                        getFloorLabel(
                                          floor.number,
                                        )
                                      }
                                    </span>
                                  </div>
                                </div>

                                <span
                                  className={[
                                    "font-mono text-[10px] font-semibold",
                                    isSelected
                                      ? "text-brand"
                                      : "text-ink-faint",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {isSelected
                                    ? "●"
                                    : "○"}
                                </span>
                              </div>
                            </button>

                            {/* ACTIONS */}

                            {isAdmin && (
                              <div className="flex items-center justify-end gap-3 border-t border-line/70 px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingFloor(
                                      floor,
                                    )
                                  }
                                  className="text-[10px] font-medium text-ink-faint transition hover:text-brand"
                                >
                                  Изменить
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      floor,
                                    )
                                  }
                                  className="text-[10px] font-medium text-ink-faint transition hover:text-danger"
                                >
                                  Удалить
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER */}

              <div className="border-t border-line bg-neutral-soft/30 p-3">
                {selectedFloor ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                        Выбран
                      </div>

                      <div className="mt-0.5 truncate text-xs font-semibold text-ink">
                        {
                          getFloorTitle(
                            selectedFloor,
                          )
                        }
                      </div>
                    </div>

                    <div className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-[10px] text-ink-soft">
                      №
                      {
                        selectedFloor.number
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-ink-faint">
                    Выберите этаж
                  </div>
                )}
              </div>
            </aside>

            {/* ========================================
                FLOOR CONTENT
            ========================================= */}

            <section className="min-w-0">
              {selectedFloor ? (
                <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                  {/* FLOOR HEADER */}

                  <div className="border-b border-line p-4 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                          <span className="text-[8px] font-semibold uppercase tracking-wide opacity-80">
                            Этаж
                          </span>

                          <span className="font-mono text-base font-semibold">
                            {
                              selectedFloor.number
                            }
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-lg font-semibold text-ink">
                            {
                              getFloorTitle(
                                selectedFloor,
                              )
                            }
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                            <span>
                              {
                                selectedFloor.roomsCount
                              }{" "}
                              {getRoomWord(
                                selectedFloor.roomsCount,
                              )}
                            </span>

                            <span>
                              ·
                            </span>

                            <span>
                              {
                                getFloorLabel(
                                  selectedFloor.number,
                                )
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingFloor(
                                selectedFloor,
                              )
                            }
                            className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-brand/30 hover:text-brand"
                          >
                            Изменить этаж
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                selectedFloor,
                              )
                            }
                            className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-danger/30 hover:text-danger"
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MAP */}

                  <div className="min-w-0 p-3 sm:p-4">
                    <FloorMapView
                      floor={
                        selectedFloor
                      }
                      isAdmin={
                        isAdmin
                      }
                      canEdit={
                        canEdit
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[560px] flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-soft text-2xl text-ink-faint">
                    □
                  </div>

                  <h2 className="mt-4 text-base font-semibold text-ink">
                    Этаж не выбран
                  </h2>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-ink-faint">
                    Выберите этаж из
                    списка слева, чтобы
                    открыть его план и
                    расположение
                    помещений.
                  </p>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        setIsCreating(
                          true,
                        )
                      }
                      className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-strong"
                    >
                      + Добавить первый этаж
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================
            MODALS
        ============================================= */}

        {isCreating && (
          <FloorFormModal
            floor={null}
            onClose={() =>
              setIsCreating(
                false,
              )
            }
            onSubmit={
              handleCreate
            }
          />
        )}

        {editingFloor && (
          <FloorFormModal
            floor={
              editingFloor
            }
            onClose={() =>
              setEditingFloor(
                null,
              )
            }
            onSubmit={
              handleUpdate
            }
          />
        )}
      </div>
    </AppShell>
  );
}