import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { WORK_STATUS_LABELS, WORK_TYPE_LABELS } from "../types/worklog";
import type { WorkLogRequest, WorkLogResponse, WorkStatus } from "../types/worklog";
import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = Object.keys(WORK_STATUS_LABELS) as WorkStatus[];

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

const STATUS_COLORS: Record<WorkStatus, string> = {
  OPEN: "border-warn/30 bg-warn-soft text-warn",
  IN_PROGRESS: "border-brand/30 bg-brand-soft text-brand-strong",
  CLOSED: "border-ok/30 bg-ok-soft text-ok",
};

export function WorkReportsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "ENGINEER";
  const isAdmin = user?.role === "ADMIN";

  // Позволяет прийти на страницу уже с фильтром по оборудованию, например
  // /reports?equipmentId=42 — переход из карточки кабинета на плане этажа.
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<WorkLogFilters>({});
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<WorkLogResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<WorkLogResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const equipmentIdParam = searchParams.get("equipmentId");
    if (equipmentIdParam) {
      const equipmentId = Number(equipmentIdParam);
      if (!Number.isNaN(equipmentId)) {
        setPage(0);
        setFilters((prev) => ({ ...prev, equipmentId }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchWorkLogsPage(filters, page, PAGE_SIZE);
      setData(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось загрузить отчёты"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  async function handleCreate(payload: WorkLogRequest) {
    await createWorkLog(payload);
    setPage(0);
    await load();
  }

  async function handleUpdate(payload: WorkLogRequest) {
    if (!editingItem) return;
    await updateWorkLog(editingItem.id, payload);
    await load();
  }

  async function handleDelete(item: WorkLogResponse) {
    if (!window.confirm(`Удалить отчёт по оборудованию ${item.equipmentInventoryNumber ?? "—"}?`)) return;
    try {
      await deleteWorkLog(item.id);
      await load();
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось удалить отчёт"));
    }
  }

  async function handleStatusChange(item: WorkLogResponse, status: WorkStatus) {
    setStatusUpdatingId(item.id);
    try {
      await updateWorkLogStatus(item.id, status);
      await load();
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось изменить статус"));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function clearEquipmentFilter() {
    setFilters((prev) => ({ ...prev, equipmentId: null }));
    navigate("/reports", { replace: true });
  }

  const colSpan = 7 + (canEdit ? 1 : 0) + (isAdmin ? 1 : 0);

  // Название техники для баннера — берём из уже загруженной страницы,
  // если там есть хотя бы одна запись по этому оборудованию.
  const filteredEquipmentLabel = filters.equipmentId
    ? data?.content.find((i) => i.equipmentId === filters.equipmentId)?.equipmentInventoryNumber
    : null;

  return (
    <AppShell title="Отчёты о работах">
      <div className="rounded-lg border border-line bg-surface">
        {filters.equipmentId && (
          <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-soft/40 px-4 py-2 text-xs text-brand-strong">
            <span>
              Показаны заявки по оборудованию{" "}
              <strong>{filteredEquipmentLabel ?? `#${filters.equipmentId}`}</strong>
            </span>
            <button
              type="button"
              onClick={clearEquipmentFilter}
              className="text-brand hover:text-brand-strong underline"
            >
              Показать все
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="tag-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
              Статус
            </label>
            <select
              id="status-filter"
              value={filters.status ?? ""}
              onChange={(e) => {
                setPage(0);
                setFilters({ ...filters, status: (e.target.value || null) as WorkStatus | null });
              }}
              className="rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="">Все статусы</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {WORK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
          >
            + Новый отчёт
          </button>
        </div>

        {error && (
          <div className="m-4 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-faint">
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Оборудование</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Тип работы</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Описание</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Исполнитель</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Затрачено</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Дата</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Статус</th>
                {canEdit && <th className="px-4 py-2.5" />}
                {isAdmin && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-8 text-center text-ink-faint">
                    Загрузка…
                  </td>
                </tr>
              )}
              {!isLoading && data?.content.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-8 text-center text-ink-faint">
                    Отчётов не найдено
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.content.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-0 hover:bg-neutral-soft/50">
                    <td className="tag-mono px-4 py-2.5 text-ink font-medium">
                      {item.equipmentInventoryNumber || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {WORK_TYPE_LABELS[item.workType]}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-ink-soft" title={item.description ?? ""}>
                      {item.description || <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{item.executorName || "—"}</td>
                    <td className="tag-mono px-4 py-2.5 text-ink-soft">
                      {formatDuration(item.timeSpentMinutes)}
                    </td>
                    <td className="tag-mono px-4 py-2.5 text-ink-soft">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      {canEdit ? (
                        <select
                          value={item.status}
                          disabled={statusUpdatingId === item.id}
                          onChange={(e) => handleStatusChange(item, e.target.value as WorkStatus)}
                          className={`rounded border px-1.5 py-1 text-xs outline-none focus:border-brand disabled:opacity-50 ${STATUS_COLORS[item.status]}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {WORK_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <WorkStatusBadge status={item.status} />
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="text-xs text-ink-faint hover:text-brand"
                        >
                          Изменить
                        </button>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="text-xs text-ink-faint hover:text-danger"
                        >
                          Удалить
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && (
          <Pagination
            page={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            onPageChange={setPage}
          />
        )}
      </div>

      {isCreating && user && (
        <WorkLogFormModal
          workLog={null}
          currentUserRole={user.role}
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingItem && user && (
        <WorkLogFormModal
          workLog={editingItem}
          currentUserRole={user.role}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdate}
        />
      )}
    </AppShell>
  );
}