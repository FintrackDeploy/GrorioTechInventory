import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { Pagination } from "../components/shared/Pagination";
import { StatusBadge } from "../components/shared/StatusBadge";
import { RoomFormModal } from "../components/rooms/RoomFormModal";

import { useAuth } from "../context/AuthContext";

import {
  createRoom,
  deleteRoom,
  fetchRoomsPage,
  updateRoom,
} from "../api/roomApi";

import { fetchFloors } from "../api/floorApi";
import { fetchAllActiveEmployees } from "../api/employeeApi";
import { extractApiErrorMessage } from "../api/client";

import { ROOM_TYPE_LABELS } from "../types/room";
import type {
  RoomRequest,
  RoomResponse,
} from "../types/room";

import type { FloorResponse } from "../types/floor";
import type { EmployeeResponse } from "../types/employee";
import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;

function getRoomWord(
  count: number,
) {
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

function getEquipmentWord(
  count: number,
) {
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

function getStatusTone(
  status: string,
) {
  const value =
    status?.toUpperCase();

  if (
    value?.includes("CRITICAL") ||
    value?.includes("DANGER")
  ) {
    return "danger";
  }

  if (
    value?.includes("WARNING") ||
    value?.includes("WARN")
  ) {
    return "warn";
  }

  if (
    value?.includes("EMPTY") ||
    value?.includes("VACANT")
  ) {
    return "neutral";
  }

  return "ok";
}

function RoomCard({
  room,
  isAdmin,
  onEdit,
  onDelete,
}: {
  room: RoomResponse;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusTone =
    getStatusTone(
      room.mapStatus,
    );

  const toneClasses = {
    ok: {
      dot: "bg-ok",
      bg: "bg-ok-soft",
      border:
        "border-ok/20",
    },
    warn: {
      dot: "bg-warn",
      bg: "bg-warn-soft",
      border:
        "border-warn/20",
    },
    danger: {
      dot: "bg-danger",
      bg: "bg-danger-soft",
      border:
        "border-danger/20",
    },
    neutral: {
      dot: "bg-neutral",
      bg: "bg-neutral-soft",
      border:
        "border-line",
    },
  } as const;

  const tone =
    toneClasses[
      statusTone as keyof typeof toneClasses
    ] ??
    toneClasses.neutral;

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-mono text-lg font-semibold ${tone.bg} text-ink`}
            >
              {room.number}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink">
                {room.name ||
                  `Кабинет ${room.number}`}
              </h3>

              <div className="mt-1 flex items-center gap-2 text-xs text-ink-faint">
                <span>
                  {room.floorNumber !=
                  null
                    ? `Этаж №${room.floorNumber}`
                    : "Этаж не указан"}
                </span>

                <span>·</span>

                <span>
                  {ROOM_TYPE_LABELS[
                    room.roomType
                  ] ??
                    room.roomType}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.bg}`}
            title="Состояние кабинета"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${tone.dot}`}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/equipment?roomId=${room.id}`}
            className="rounded-xl border border-line bg-canvas p-3 transition hover:border-brand/30 hover:bg-brand-soft"
          >
            <div className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              Оборудование
            </div>

            <div className="mt-1 flex items-end gap-1">
              <span className="font-mono text-xl font-semibold text-ink">
                {room.equipmentCount}
              </span>

              <span className="mb-0.5 text-[10px] text-ink-faint">
                {getEquipmentWord(
                  room.equipmentCount,
                )}
              </span>
            </div>

            {room.inRepair >
              0 && (
              <div className="mt-1 text-[10px] font-medium text-warn">
                {room.inRepair} в ремонте
              </div>
            )}
          </Link>

          <div className="rounded-xl border border-line bg-canvas p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              Сотрудники
            </div>

            <div className="mt-1 flex items-end gap-1">
              <span className="font-mono text-xl font-semibold text-ink">
                {room.employees
                  ?.length ??
                  0}
              </span>

              <span className="mb-0.5 text-[10px] text-ink-faint">
                {getRoomWord(
                  room.employees
                    ?.length ??
                    0,
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              Ответственные
            </span>

            <span className="text-[10px] text-ink-faint">
              {room.employees
                ?.length ?? 0}
            </span>
          </div>

          {room.employees &&
          room.employees.length >
            0 ? (
            <div className="flex flex-wrap gap-1.5">
              {room.employees
                .slice(0, 3)
                .map((employee) => (
                  <span
                    key={
                      employee.id
                    }
                    className="inline-flex max-w-full items-center rounded-lg border border-line bg-neutral-soft px-2 py-1 text-[11px] text-ink-soft"
                  >
                    <span className="truncate">
                      {
                        employee.fullName
                      }
                    </span>
                  </span>
                ))}

              {room.employees.length >
                3 && (
                <span className="inline-flex items-center rounded-lg border border-line bg-neutral-soft px-2 py-1 text-[11px] font-medium text-ink-faint">
                  +
                  {room
                    .employees
                    .length -
                    3}
                </span>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line px-3 py-2 text-xs text-ink-faint">
              Сотрудники не
              назначены
            </div>
          )}
        </div>

        <div
          className={`mt-4 flex items-center justify-between rounded-xl border px-3 py-2.5 ${tone.border} ${tone.bg}`}
        >
          <span className="text-xs font-medium text-ink-soft">
            Состояние
          </span>

          <StatusBadge
            status={
              room.mapStatus
            }
          />
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center justify-end gap-4 border-t border-line bg-neutral-soft/30 px-5 py-3">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-ink-faint transition hover:text-brand"
          >
            Изменить
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-medium text-ink-faint transition hover:text-danger"
          >
            Удалить
          </button>
        </div>
      )}
    </article>
  );
}

export function RoomsPage() {
  const { user } = useAuth();

  const isAdmin =
    user?.role === "ADMIN";

  const [floors, setFloors] =
    useState<FloorResponse[]>(
      [],
    );

  const [employees, setEmployees] =
    useState<EmployeeResponse[]>(
      [],
    );

  const [floorFilter, setFloorFilter] =
    useState<number | null>(
      null,
    );

  const [page, setPage] =
    useState(0);

  const [data, setData] =
    useState<PageResponse<RoomResponse> | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    editingRoom,
    setEditingRoom,
  ] = useState<RoomResponse | null>(
    null,
  );

  const [isCreating, setIsCreating] =
    useState(false);

  useEffect(() => {
    fetchFloors()
      .then(setFloors)
      .catch(() => setFloors([]));

    fetchAllActiveEmployees()
      .then(setEmployees)
      .catch(() =>
        setEmployees([]),
      );
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const result =
        await fetchRoomsPage(
          floorFilter,
          page,
          PAGE_SIZE,
        );

      setData(result);
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Не удалось загрузить кабинеты",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorFilter, page]);

  async function handleCreate(
    payload: RoomRequest,
  ) {
    await createRoom(payload);

    setPage(0);

    await load();
  }

  async function handleUpdate(
    payload: RoomRequest,
  ) {
    if (!editingRoom) {
      return;
    }

    await updateRoom(
      editingRoom.id,
      payload,
    );

    setEditingRoom(null);

    await load();
  }

  async function handleDelete(
    room: RoomResponse,
  ) {
    if (
      !window.confirm(
        `Удалить кабинет ${room.number}? Оборудование в нём останется без кабинета.`,
      )
    ) {
      return;
    }

    try {
      await deleteRoom(room.id);

      await load();
    } catch (err) {
      window.alert(
        extractApiErrorMessage(
          err,
          "Не удалось удалить кабинет",
        ),
      );
    }
  }

  const rooms =
    data?.content ?? [];

  const roomStats = useMemo(() => {
    const total =
      data?.totalElements ??
      rooms.length;

    const equipment =
      rooms.reduce(
        (sum, room) =>
          sum +
          (room.equipmentCount ||
            0),
        0,
      );

    const repair =
      rooms.reduce(
        (sum, room) =>
          sum +
          (room.inRepair || 0),
        0,
      );

    const employeesCount =
      rooms.reduce(
        (sum, room) =>
          sum +
          (room.employees
            ?.length ?? 0),
        0,
      );

    return {
      total,
      equipment,
      repair,
      employeesCount,
    };
  }, [data, rooms]);

  return (
    <AppShell title="Кабинеты">
      <div className="space-y-5">
        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
              Помещения
            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Кабинеты
            </h1>

            <p className="mt-1 text-sm text-ink-soft">
              Помещения, сотрудники и
              оборудование.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                setIsCreating(true)
              }
              className="self-start rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong lg:self-auto"
            >
              + Новый кабинет
            </button>
          )}
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Всего
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ink">
              {roomStats.total}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              {getRoomWord(
                roomStats.total,
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Оборудование
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-brand-strong">
              {roomStats.equipment}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              закреплено в
              кабинетах
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Сотрудники
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ink">
              {roomStats.employeesCount}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              назначено
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-surface p-4 shadow-sm ${
              roomStats.repair >
              0
                ? "border-warn/30"
                : "border-line"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              В ремонте
            </div>

            <div
              className={`mt-1 font-mono text-2xl font-semibold ${
                roomStats.repair >
                0
                  ? "text-warn"
                  : "text-ok"
              }`}
            >
              {roomStats.repair}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              единиц техники
            </div>
          </div>
        </div>

        {/* FILTER */}

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                Фильтр
              </div>

              <div className="mt-1 text-sm font-medium text-ink">
                Показать кабинеты
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                htmlFor="floor-filter"
                className="sr-only"
              >
                Этаж
              </label>

              <select
                id="floor-filter"
                value={
                  floorFilter ?? ""
                }
                onChange={(event) => {
                  setPage(0);

                  setFloorFilter(
                    event.target
                      .value
                      ? Number(
                          event
                            .target
                            .value,
                        )
                      : null,
                  );
                }}
                className="min-w-[220px] rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              >
                <option value="">
                  Все этажи
                </option>

                {floors.map(
                  (floor) => (
                    <option
                      key={
                        floor.id
                      }
                      value={
                        floor.id
                      }
                    >
                      №
                      {
                        floor.number
                      }{" "}
                      {floor.name
                        ? `— ${floor.name}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              {floorFilter !==
                null && (
                <button
                  type="button"
                  onClick={() => {
                    setPage(0);
                    setFloorFilter(
                      null,
                    );
                  }}
                  className="rounded-xl border border-line bg-neutral-soft px-3 py-2.5 text-xs font-medium text-ink-soft transition hover:border-brand/30 hover:text-brand"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-danger">
              {error}
            </div>

            <button
              type="button"
              onClick={load}
              className="self-start rounded-lg border border-danger/20 bg-surface px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/5 sm:self-auto"
            >
              Повторить
            </button>
          </div>
        )}

        {/* CONTENT */}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="h-[330px] animate-pulse rounded-2xl border border-line bg-surface"
              />
            ))}
          </div>
        ) : rooms.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-soft text-xl text-ink-faint">
              □
            </div>

            <h2 className="mt-4 text-sm font-semibold text-ink">
              Кабинеты не найдены
            </h2>

            <p className="mt-1 text-xs text-ink-faint">
              Попробуйте изменить
              фильтр по этажу.
            </p>

            {floorFilter !==
              null && (
              <button
                type="button"
                onClick={() => {
                  setPage(0);
                  setFloorFilter(
                    null,
                  );
                }}
                className="mt-4 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-strong"
              >
                Показать все
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map(
              (room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isAdmin={isAdmin}
                  onEdit={() =>
                    setEditingRoom(
                      room,
                    )
                  }
                  onDelete={() =>
                    handleDelete(
                      room,
                    )
                  }
                />
              ),
            )}
          </div>
        )}

        {/* PAGINATION */}

        {data && (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <Pagination
              page={data.number}
              totalPages={
                data.totalPages
              }
              totalElements={
                data.totalElements
              }
              onPageChange={
                setPage
              }
            />
          </div>
        )}

        {/* CREATE */}

        {isCreating && (
          <RoomFormModal
            room={null}
            floors={floors}
            employees={employees}
            defaultFloorId={
              floorFilter
            }
            onClose={() =>
              setIsCreating(false)
            }
            onSubmit={
              handleCreate
            }
          />
        )}

        {/* EDIT */}

        {editingRoom && (
          <RoomFormModal
            room={editingRoom}
            floors={floors}
            employees={employees}
            onClose={() =>
              setEditingRoom(null)
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