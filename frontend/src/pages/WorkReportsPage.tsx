import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { Pagination } from "../components/shared/Pagination";
import { WorkStatusBadge } from "../components/worklogs/WorkStatusBadge";
import { WorkLogFormModal } from "../components/worklogs/WorkLogFormModal";

import { useAuth } from "../context/AuthContext";

import {
  createWorkLog,
  deleteWorkLog,
  fetchWorkLogsPage,
  updateWorkLog,
  updateWorkLogStatus,
} from "../api/workLogApi";

import type { WorkLogFilters } from "../api/workLogApi";

import { extractApiErrorMessage } from "../api/client";

import {
  WORK_STATUS_LABELS,
  WORK_TYPE_LABELS,
} from "../types/worklog";

import type {
  WorkLogRequest,
  WorkLogResponse,
  WorkStatus,
} from "../types/worklog";

import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;

const STATUS_OPTIONS =
  Object.keys(
    WORK_STATUS_LABELS,
  ) as WorkStatus[];

const STATUS_STYLES: Record<
  WorkStatus,
  string
> = {
  OPEN:
    "border-warn/30 bg-warn-soft text-warn",
  IN_PROGRESS:
    "border-brand/30 bg-brand-soft text-brand-strong",
  CLOSED:
    "border-ok/30 bg-ok-soft text-ok",
};

const STATUS_DOT: Record<
  WorkStatus,
  string
> = {
  OPEN: "bg-warn",
  IN_PROGRESS: "bg-brand",
  CLOSED: "bg-ok",
};

function formatDateTime(
  iso: string | null,
): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);

  return date.toLocaleString(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function formatDuration(
  minutes: number | null,
): string {
  if (!minutes) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remaining =
    minutes % 60;

  return remaining > 0
    ? `${hours} ч ${remaining} мин`
    : `${hours} ч`;
}

function getInitials(
  name: string | null,
): string {
  if (!name) {
    return "?";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase();
}

function getCountWord(
  count: number,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return "заявка";
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 10 ||
      mod100 >= 20)
  ) {
    return "заявки";
  }

  return "заявок";
}

function WorkReportCard({
  item,
  canEdit,
  isAdmin,
  statusUpdatingId,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  item: WorkLogResponse;
  canEdit: boolean;
  isAdmin: boolean;
  statusUpdatingId: number | null;
  onStatusChange: (
    item: WorkLogResponse,
    status: WorkStatus,
  ) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className="
        group
        overflow-hidden
        rounded-2xl
        border
        border-line
        bg-surface
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-brand/30
        hover:shadow-md
      "
    >
      <div className="p-5">
        {/* HEADER */}

        <div className="flex items-start gap-4">
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-brand-soft
              font-mono
              text-xs
              font-semibold
              text-brand-strong
            "
          >
            {getInitials(
              item.executorName,
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Оборудование
                </div>

                <div className="mt-1 truncate font-mono text-sm font-semibold text-ink">
                  {item.equipmentInventoryNumber ||
                    "—"}
                </div>
              </div>

              <span
                className={`
                  inline-flex
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-wide
                  ${STATUS_STYLES[item.status]}
                `}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[item.status]}`}
                />

                {
                  WORK_STATUS_LABELS[
                    item.status
                  ]
                }
              </span>
            </div>
          </div>
        </div>

        {/* WORK TYPE */}

        <div className="mt-5 rounded-xl border border-line bg-canvas px-3 py-3">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Тип работы
          </div>

          <div className="mt-1 text-sm font-medium text-ink">
            {
              WORK_TYPE_LABELS[
                item.workType
              ]
            }
          </div>
        </div>

        {/* DESCRIPTION */}

        <div className="mt-3">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Описание
          </div>

          <div
            className="
              mt-1
              min-h-[42px]
              text-xs
              leading-5
              text-ink-soft
            "
            title={
              item.description ??
              ""
            }
          >
            {item.description ||
              "Описание не указано"}
          </div>
        </div>

        {/* META */}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-line bg-canvas px-3 py-2.5">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
              Исполнитель
            </div>

            <div className="mt-1 truncate text-xs font-medium text-ink">
              {item.executorName ||
                "Не назначен"}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-canvas px-3 py-2.5">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
              Время
            </div>

            <div className="mt-1 font-mono text-xs font-medium text-ink">
              {formatDuration(
                item.timeSpentMinutes,
              )}
            </div>
          </div>
        </div>

        {/* DATE */}

        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-neutral-soft/40 px-3 py-2.5">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
            Создано
          </span>

          <span className="font-mono text-xs text-ink-soft">
            {formatDateTime(
              item.createdAt,
            )}
          </span>
        </div>

        {/* STATUS */}

        {canEdit && (
          <div className="mt-4">
            <label
              htmlFor={`work-status-${item.id}`}
              className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint"
            >
              Изменить статус
            </label>

            <select
              id={`work-status-${item.id}`}
              value={item.status}
              disabled={
                statusUpdatingId ===
                item.id
              }
              onChange={(event) =>
                onStatusChange(
                  item,
                  event.target
                    .value as WorkStatus,
                )
              }
              className={`
                w-full
                rounded-xl
                border
                px-3
                py-2.5
                text-xs
                font-medium
                outline-none
                transition
                focus:border-brand
                disabled:cursor-wait
                disabled:opacity-50
                ${STATUS_STYLES[item.status]}
              `}
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {
                      WORK_STATUS_LABELS[
                        status
                      ]
                    }
                  </option>
                ),
              )}
            </select>
          </div>
        )}
      </div>

      {/* ACTIONS */}

      {(canEdit || isAdmin) && (
        <div className="flex items-center justify-end gap-4 border-t border-line bg-neutral-soft/30 px-5 py-3">
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-medium text-ink-faint transition hover:text-brand"
            >
              Изменить
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs font-medium text-ink-faint transition hover:text-danger"
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export function WorkReportsPage() {
  const { user } =
    useAuth();

  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "ENGINEER";

  const isAdmin =
    user?.role === "ADMIN";

  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const [filters, setFilters] =
    useState<WorkLogFilters>(
      {},
    );

  const [page, setPage] =
    useState(0);

  const [data, setData] =
    useState<PageResponse<WorkLogResponse> | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    editingItem,
    setEditingItem,
  ] = useState<WorkLogResponse | null>(
    null,
  );

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    statusUpdatingId,
    setStatusUpdatingId,
  ] = useState<number | null>(
    null,
  );

  /*
   * Equipment filter from URL.
   *
   * Example:
   * /reports?equipmentId=42
   */

  useEffect(() => {
    const equipmentIdParam =
      searchParams.get(
        "equipmentId",
      );

    if (!equipmentIdParam) {
      return;
    }

    const equipmentId =
      Number(
        equipmentIdParam,
      );

    if (
      Number.isNaN(
        equipmentId,
      )
    ) {
      return;
    }

    setPage(0);

    setFilters((prev) => ({
      ...prev,
      equipmentId,
    }));
  }, [searchParams]);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const result =
        await fetchWorkLogsPage(
          filters,
          page,
          PAGE_SIZE,
        );

      setData(result);
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Не удалось загрузить отчёты",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  async function handleCreate(
    payload: WorkLogRequest,
  ) {
    await createWorkLog(
      payload,
    );

    setPage(0);

    await load();
  }

  async function handleUpdate(
    payload: WorkLogRequest,
  ) {
    if (!editingItem) {
      return;
    }

    await updateWorkLog(
      editingItem.id,
      payload,
    );

    setEditingItem(null);

    await load();
  }

  async function handleDelete(
    item: WorkLogResponse,
  ) {
    if (
      !window.confirm(
        `Удалить отчёт по оборудованию ${
          item.equipmentInventoryNumber ??
          "—"
        }?`,
      )
    ) {
      return;
    }

    try {
      await deleteWorkLog(
        item.id,
      );

      await load();
    } catch (err) {
      window.alert(
        extractApiErrorMessage(
          err,
          "Не удалось удалить отчёт",
        ),
      );
    }
  }

  async function handleStatusChange(
    item: WorkLogResponse,
    status: WorkStatus,
  ) {
    setStatusUpdatingId(
      item.id,
    );

    try {
      await updateWorkLogStatus(
        item.id,
        status,
      );

      await load();
    } catch (err) {
      window.alert(
        extractApiErrorMessage(
          err,
          "Не удалось изменить статус",
        ),
      );
    } finally {
      setStatusUpdatingId(
        null,
      );
    }
  }

  function clearEquipmentFilter() {
    setFilters((prev) => ({
      ...prev,
      equipmentId: null,
    }));

    navigate("/reports", {
      replace: true,
    });
  }

  const reports =
    data?.content ?? [];

  /*
   * Statistics for the currently
   * loaded result.
   */

  const stats = useMemo(() => {
    const open = reports.filter(
      (item) =>
        item.status === "OPEN",
    ).length;

    const inProgress =
      reports.filter(
        (item) =>
          item.status ===
          "IN_PROGRESS",
      ).length;

    const closed =
      reports.filter(
        (item) =>
          item.status ===
          "CLOSED",
      ).length;

    const totalMinutes =
      reports.reduce(
        (sum, item) =>
          sum +
          (item.timeSpentMinutes ||
            0),
        0,
      );

    return {
      open,
      inProgress,
      closed,
      totalMinutes,
    };
  }, [reports]);

  function formatTotalMinutes(
    minutes: number,
  ) {
    if (minutes === 0) {
      return "0 мин";
    }

    if (minutes < 60) {
      return `${minutes} мин`;
    }

    const hours =
      Math.floor(
        minutes / 60,
      );

    const remaining =
      minutes % 60;

    return remaining > 0
      ? `${hours} ч ${remaining} мин`
      : `${hours} ч`;
  }

  /*
   * Equipment name for active
   * equipment filter banner.
   */

  const filteredEquipmentLabel =
    filters.equipmentId
      ? data?.content.find(
          (item) =>
            item.equipmentId ===
            filters.equipmentId,
        )
          ?.equipmentInventoryNumber
      : null;

  return (
    <AppShell title="Отчёты о работах">
      <div className="space-y-5">
        {/* ============================================
            HEADER
        ============================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
              Обслуживание
            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Отчёты о работах
            </h1>

            <p className="mt-1 text-sm text-ink-soft">
              Заявки, обслуживание
              оборудования и история
              выполненных работ.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsCreating(true)
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
              lg:self-auto
            "
          >
            + Новый отчёт
          </button>
        </div>

        {/* ============================================
            EQUIPMENT FILTER
        ============================================= */}

        {filters.equipmentId && (
          <div className="flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand-soft/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-white">
                #
              </div>

              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-brand">
                  Фильтр по оборудованию
                </div>

                <div className="mt-0.5 truncate font-mono text-xs font-semibold text-brand-strong">
                  {filteredEquipmentLabel ??
                    `Оборудование #${filters.equipmentId}`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                clearEquipmentFilter
              }
              className="self-start rounded-lg border border-brand/20 bg-surface px-3 py-2 text-xs font-medium text-brand transition hover:border-brand/40 sm:self-auto"
            >
              Показать все
            </button>
          </div>
        )}

        {/* ============================================
            STATS
        ============================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Всего
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ink">
              {data?.totalElements ??
                0}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              {getCountWord(
                data?.totalElements ??
                  0,
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-warn/20 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <span className="h-2 w-2 rounded-full bg-warn" />
              Открытые
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-warn">
              {stats.open}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              требуют внимания
            </div>
          </div>

          <div className="rounded-2xl border border-brand/20 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <span className="h-2 w-2 rounded-full bg-brand" />
              В работе
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-brand-strong">
              {stats.inProgress}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              выполняются сейчас
            </div>
          </div>

          <div className="rounded-2xl border border-ok/20 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <span className="h-2 w-2 rounded-full bg-ok" />
              Выполнено
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ok">
              {stats.closed}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              на текущей странице
            </div>
          </div>
        </div>

        {/* ============================================
            WORKLOAD SUMMARY
        ============================================= */}

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Затраченное время
              </div>

              <div className="mt-1 font-mono text-xl font-semibold text-ink">
                {formatTotalMinutes(
                  stats.totalMinutes,
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setPage(0);

                      setFilters(
                        (prev) => ({
                          ...prev,
                          status,
                        }),
                      );
                    }}
                    className={`
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      px-3
                      py-2
                      text-xs
                      font-medium
                      transition
                      hover:-translate-y-px
                      ${STATUS_STYLES[status]}
                    `}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
                    />

                    {
                      WORK_STATUS_LABELS[
                        status
                      ]
                    }
                  </button>
                ),
              )}

              {filters.status && (
                <button
                  type="button"
                  onClick={() => {
                    setPage(0);

                    setFilters(
                      (prev) => ({
                        ...prev,
                        status: null,
                      }),
                    );
                  }}
                  className="rounded-xl border border-line bg-neutral-soft px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-brand/30 hover:text-brand"
                >
                  Все статусы
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================
            MAIN LIST
        ============================================= */}

        <div className="rounded-2xl border border-line bg-surface shadow-sm">
          {/* TOOLBAR */}

          <div className="border-b border-line p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">
                  Список работ
                </div>

                <div className="mt-1 text-xs text-ink-faint">
                  {data
                    ? `Показано ${reports.length} из ${data.totalElements}`
                    : "Загрузка…"}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label
                  htmlFor="status-filter"
                  className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint"
                >
                  Статус
                </label>

                <select
                  id="status-filter"
                  value={
                    filters.status ??
                    ""
                  }
                  onChange={(
                    event,
                  ) => {
                    setPage(0);

                    setFilters(
                      (prev) => ({
                        ...prev,
                        status:
                          (event
                            .target
                            .value ||
                            null) as
                            | WorkStatus
                            | null,
                      }),
                    );
                  }}
                  className="
                    min-w-[190px]
                    rounded-xl
                    border
                    border-line
                    bg-canvas
                    px-3
                    py-2.5
                    text-sm
                    text-ink
                    outline-none
                    transition
                    focus:border-brand
                    focus:ring-2
                    focus:ring-brand/10
                  "
                >
                  <option value="">
                    Все статусы
                  </option>

                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          WORK_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            {/* ACTIVE FILTERS */}

            <div className="mt-3 flex flex-wrap gap-2">
              {filters.status && (
                <button
                  type="button"
                  onClick={() => {
                    setPage(0);

                    setFilters(
                      (prev) => ({
                        ...prev,
                        status: null,
                      }),
                    );
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-medium ${STATUS_STYLES[filters.status]}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[filters.status]}`}
                  />

                  {
                    WORK_STATUS_LABELS[
                      filters.status
                    ]
                  }

                  <span>
                    ×
                  </span>
                </button>
              )}

              {filters.equipmentId && (
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1.5 text-[10px] font-medium text-brand-strong">
                  Оборудование #
                  {
                    filters.equipmentId
                  }
                </span>
              )}
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="m-4 flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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

          {/* CARDS */}

          <div className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-[410px] animate-pulse rounded-2xl border border-line bg-canvas"
                    />
                  ),
                )}
              </div>
            ) : reports.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-canvas px-5 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-soft text-xl text-ink-faint">
                  ✓
                </div>

                <h3 className="mt-4 text-sm font-semibold text-ink">
                  Отчётов не найдено
                </h3>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-faint">
                  По выбранным
                  фильтрам нет
                  заявок.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setPage(0);

                    setFilters(
                      {},
                    );

                    if (
                      searchParams.has(
                        "equipmentId",
                      )
                    ) {
                      navigate(
                        "/reports",
                        {
                          replace: true,
                        },
                      );
                    }
                  }}
                  className="mt-4 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-strong"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map(
                  (item) => (
                    <WorkReportCard
                      key={
                        item.id
                      }
                      item={item}
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
                        handleStatusChange
                      }
                      onEdit={() =>
                        setEditingItem(
                          item,
                        )
                      }
                      onDelete={() =>
                        handleDelete(
                          item,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </div>

          {/* PAGINATION */}

          {data && (
            <div className="border-t border-line">
              <Pagination
                page={
                  data.number
                }
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
        </div>

        {/* CREATE */}

        {isCreating &&
          user && (
            <WorkLogFormModal
              workLog={null}
              currentUserRole={
                user.role
              }
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

        {/* EDIT */}

        {editingItem &&
          user && (
            <WorkLogFormModal
              workLog={
                editingItem
              }
              currentUserRole={
                user.role
              }
              onClose={() =>
                setEditingItem(
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