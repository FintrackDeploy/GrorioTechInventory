import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Pagination } from "../components/shared/Pagination";
import { EquipmentStatusBadge } from "../components/equipment/EquipmentStatusBadge";
import { EquipmentFilterBar } from "../components/equipment/EquipmentFilterBar";
import { EquipmentFormModal } from "../components/equipment/EquipmentFormModal";
import { EquipmentGroupFormModal } from "../components/equipment/EquipmentGroupFormModal";
import { EquipmentGroupViewModal } from "../components/equipment/EquipmentGroupViewModal";
import { useAuth } from "../context/AuthContext";
import {
  createEquipment,
  createEquipmentBatch,
  deleteEquipment,
  fetchEquipmentPage,
  updateEquipment,
  updateEquipmentStatus,
} from "../api/equipmentApi";
import type { EquipmentFilters } from "../api/equipmentApi";
import { fetchAllRooms } from "../api/roomApi";
import { fetchAllActiveEmployees } from "../api/employeeApi";
import { extractApiErrorMessage } from "../api/client";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
  COMPUTER_TYPES,
  NETWORK_TYPES,
} from "../types/equipment";
import type {
  EquipmentBatchRequest,
  EquipmentRequest,
  EquipmentResponse,
  EquipmentStatus,
} from "../types/equipment";
import type { RoomResponse } from "../types/room";
import type { EmployeeResponse } from "../types/employee";
import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = Object.keys(EQUIPMENT_STATUS_LABELS) as EquipmentStatus[];

function specSummary(item: EquipmentResponse): string {
  if (COMPUTER_TYPES.includes(item.type)) {
    const parts: string[] = [];
    if (item.cpu) parts.push(item.cpu);
    if (item.ramGb) parts.push(`${item.ramGb} ГБ`);
    if (item.storage) parts.push(item.storage);
    return parts.join(" · ") || "—";
  }
  if (item.type === "MONITOR" || item.type === "PROJECTOR") {
    const parts: string[] = [];
    if (item.diagonalInch) parts.push(`${item.diagonalInch}"`);
    if (item.resolution) parts.push(item.resolution);
    if (item.panelType) parts.push(item.panelType);
    if (item.connectors) parts.push(item.connectors);
    return parts.join(" · ") || "—";
  }
  if (item.type === "PRINTER" || item.type === "MFP") {
    const parts: string[] = [];
    if (item.printFormat) parts.push(item.printFormat);
    if (item.printSpeedPpm) parts.push(`${item.printSpeedPpm} стр/мин`);
    if (item.printColor != null) parts.push(item.printColor ? "цветной" : "ч/б");
    return parts.join(" · ") || "—";
  }
  if (item.type === "MOUSE") {
    return item.wireless != null ? (item.wireless ? "Беспроводная" : "Проводная") : "—";
  }
  if (item.type === "KEYBOARD") {
    const parts: string[] = [];
    if (item.switchType) parts.push(item.switchType);
    if (item.wireless != null) parts.push(item.wireless ? "беспроводная" : "проводная");
    return parts.join(" · ") || "—";
  }
  if (item.type === "SWITCH" || item.type === "ROUTER" || item.type === "ACCESS_POINT") {
    if (item.portCount) return `${item.portCount} порт.`;
  }
  if (item.type === "UPS") {
    const parts: string[] = [];
    if (item.powerVa) parts.push(`${item.powerVa} ВА`);
    if (item.batteryRuntimeMin) parts.push(`${item.batteryRuntimeMin} мин`);
    return parts.join(" · ") || "—";
  }
  return "—";
}

export function EquipmentPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "ENGINEER";
  const isAdmin = user?.role === "ADMIN";

  const [searchParams] = useSearchParams();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);

  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [debouncedFilters, setDebouncedFilters] = useState<EquipmentFilters>({});
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<EquipmentResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<EquipmentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [viewingGroupNumber, setViewingGroupNumber] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAllRooms().then(setRooms).catch(() => setRooms([]));
    fetchAllActiveEmployees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    const roomIdParam = searchParams.get("roomId");
    if (roomIdParam) {
      const roomId = Number(roomIdParam);
      if (!Number.isNaN(roomId)) {
        setPage(0);
        setFilters((prev) => ({ ...prev, roomId }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(0);
      setDebouncedFilters(filters);
    }, 350);
    return () => clearTimeout(handle);
  }, [filters]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchEquipmentPage(debouncedFilters, page, PAGE_SIZE);
      setData(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось загрузить оборудование"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters, page]);

  async function handleCreate(payload: EquipmentRequest) {
    await createEquipment(payload);
    setPage(0);
    await load();
  }

  async function handleCreateGroup(payload: EquipmentBatchRequest) {
    await createEquipmentBatch(payload);
    setPage(0);
    await load();
  }

  async function handleUpdate(payload: EquipmentRequest) {
    if (!editingItem) return;
    await updateEquipment(editingItem.id, payload);
    await load();
  }

  async function handleDelete(item: EquipmentResponse) {
    if (!window.confirm(`Удалить оборудование ${item.inventoryNumber}?`)) return;
    try {
      await deleteEquipment(item.id);
      await load();
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось удалить оборудование"));
    }
  }

  async function handleStatusChange(item: EquipmentResponse, status: EquipmentStatus) {
    setStatusUpdatingId(item.id);
    try {
      await updateEquipmentStatus(item.id, status);
      await load();
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось изменить статус"));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  const colSpan = 6 + (canEdit ? 1 : 0);

  const filteredRoom = filters.roomId ? rooms.find((r) => r.id === filters.roomId) : null;

  return (
    <AppShell title="Оборудование">
      <div className="rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Список оборудования</h2>
          {canEdit && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingGroup(true)}
                title="Завести несколько единиц техники одним инвентарным номером"
                className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-soft"
              >
                + Комплект
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
              >
                + Оборудование
              </button>
            </div>
          )}
        </div>

        {filteredRoom && (
          <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-soft/40 px-4 py-2 text-xs text-brand-strong">
            <span>
              Показана техника кабинета <strong>{filteredRoom.number}</strong>
              {filteredRoom.name ? ` — ${filteredRoom.name}` : ""}
            </span>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, roomId: null }))}
              className="text-brand hover:text-brand-strong underline"
            >
              Показать всё
            </button>
          </div>
        )}

        <EquipmentFilterBar
          filters={filters}
          onChange={setFilters}
          rooms={rooms}
          employees={employees}
        />

        {error && (
          <div className="m-4 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-faint">
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Инв. №</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Тип</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Характеристики</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Кабинет</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Ответственный</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Статус</th>
                {canEdit && <th className="px-4 py-2.5" />}
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
                    Оборудование не найдено
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.content.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-line last:border-0 hover:bg-neutral-soft/50"
                  >
                    <td className="tag-mono px-4 py-2.5 text-ink">
                      <div className="flex items-center gap-1.5">
                        <span>{item.inventoryNumber}</span>
                        {item.groupSize > 1 && (
                          <button
                            type="button"
                            onClick={() => setViewingGroupNumber(item.inventoryNumber)}
                            title="Показать весь комплект по этому инв. номеру"
                            className="tag-mono rounded border border-brand/30 bg-brand-soft px-1 py-0.5 text-[10px] text-brand-strong hover:bg-brand-soft/70"
                          >
                            ×{item.groupSize}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded border border-line bg-neutral-soft px-1.5 py-0.5 text-[11px] text-ink-soft">
                        {EQUIPMENT_TYPE_LABELS[item.type]}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-2.5 text-xs text-ink-soft">
                      {specSummary(item)}
                      {NETWORK_TYPES.includes(item.type) && item.ipAddress && (
                        <div className="tag-mono mt-0.5 text-ink-faint">{item.ipAddress}</div>
                      )}
                    </td>
                    <td className="tag-mono px-4 py-2.5 text-ink-soft">{item.roomNumber || "—"}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{item.responsibleEmployeeName || "—"}</td>
                    <td className="px-4 py-2.5">
                      {canEdit ? (
                        <select
                          value={item.status}
                          disabled={statusUpdatingId === item.id}
                          onChange={(e) => handleStatusChange(item, e.target.value as EquipmentStatus)}
                          className="rounded border border-line bg-white px-1.5 py-1 text-xs text-ink-soft outline-none focus:border-brand disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {EQUIPMENT_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <EquipmentStatusBadge status={item.status} />
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="mr-3 text-xs text-ink-faint hover:text-brand"
                        >
                          Изменить
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="text-xs text-ink-faint hover:text-danger"
                          >
                            Удалить
                          </button>
                        )}
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

      {isCreating && (
        <EquipmentFormModal
          equipment={null}
          rooms={rooms}
          employees={employees}
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingItem && (
        <EquipmentFormModal
          equipment={editingItem}
          rooms={rooms}
          employees={employees}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdate}
        />
      )}
      {isCreatingGroup && (
        <EquipmentGroupFormModal
          rooms={rooms}
          employees={employees}
          onClose={() => setIsCreatingGroup(false)}
          onSubmit={handleCreateGroup}
        />
      )}
      {viewingGroupNumber && (
        <EquipmentGroupViewModal
          inventoryNumber={viewingGroupNumber}
          onClose={() => setViewingGroupNumber(null)}
          onEditItem={(item) => {
            setViewingGroupNumber(null);
            setEditingItem(item);
          }}
        />
      )}
    </AppShell>
  );
}