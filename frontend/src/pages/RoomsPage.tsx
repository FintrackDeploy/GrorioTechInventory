import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Pagination } from "../components/shared/Pagination";
import { StatusBadge } from "../components/shared/StatusBadge";
import { RoomFormModal } from "../components/rooms/RoomFormModal";
import { useAuth } from "../context/AuthContext";
import { createRoom, deleteRoom, fetchRoomsPage, updateRoom } from "../api/roomApi";
import { fetchFloors } from "../api/floorApi";
import { fetchAllActiveEmployees } from "../api/employeeApi";
import { extractApiErrorMessage } from "../api/client";
import { ROOM_TYPE_LABELS } from "../types/room";
import type { RoomRequest, RoomResponse } from "../types/room";
import type { FloorResponse } from "../types/floor";
import type { EmployeeResponse } from "../types/employee";
import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;

export function RoomsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [floors, setFloors] = useState<FloorResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [floorFilter, setFloorFilter] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<RoomResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchFloors().then(setFloors).catch(() => setFloors([]));
    fetchAllActiveEmployees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchRoomsPage(floorFilter, page, PAGE_SIZE);
      setData(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось загрузить кабинеты"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorFilter, page]);

  async function handleCreate(payload: RoomRequest) {
    await createRoom(payload);
    setPage(0);
    await load();
  }

  async function handleUpdate(payload: RoomRequest) {
    if (!editingRoom) return;
    await updateRoom(editingRoom.id, payload);
    await load();
  }

  async function handleDelete(room: RoomResponse) {
    if (!window.confirm(`Удалить кабинет ${room.number}? Оборудование в нём останется без кабинета.`)) {
      return;
    }
    try {
      await deleteRoom(room.id);
      await load();
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось удалить кабинет"));
    }
  }

  return (
    <AppShell title="Кабинеты">
      <div className="rounded-lg border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor="floor-filter" className="tag-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
              Этаж
            </label>
            <select
              id="floor-filter"
              value={floorFilter ?? ""}
              onChange={(e) => {
                setPage(0);
                setFloorFilter(e.target.value ? Number(e.target.value) : null);
              }}
              className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="">Все этажи</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  №{f.number} {f.name ? `— ${f.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
            >
              + Кабинет
            </button>
          )}
        </div>

        {error && (
          <div className="m-4 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-faint">
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">№</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Название</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Этаж</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Тип</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Сотрудники</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Техника</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Статус</th>
                {isAdmin && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-ink-faint">
                    Загрузка…
                  </td>
                </tr>
              )}
              {!isLoading && data?.content.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-ink-faint">
                    Кабинетов не найдено
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.content.map((room) => (
                  <tr key={room.id} className="border-b border-line last:border-0 hover:bg-neutral-soft/50">
                    <td className="tag-mono px-4 py-2.5 text-ink">{room.number}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{room.name || "—"}</td>
                    <td className="tag-mono px-4 py-2.5 text-ink-soft">
                      {room.floorNumber != null ? `№${room.floorNumber}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{ROOM_TYPE_LABELS[room.roomType]}</td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {room.employees && room.employees.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {room.employees.slice(0, 2).map((emp) => (
                            <span
                              key={emp.id}
                              className="inline-flex items-center rounded border border-line bg-neutral-soft px-1.5 py-0.5 text-[11px] text-ink-soft"
                            >
                              {emp.fullName.split(" ")[0]}
                            </span>
                          ))}
                          {room.employees.length > 2 && (
                            <span className="text-[11px] text-ink-faint">
                              +{room.employees.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="tag-mono px-4 py-2.5 text-ink-soft">
                      <Link
                        to={`/equipment?roomId=${room.id}`}
                        className="hover:text-brand hover:underline"
                        title="Показать технику этого кабинета"
                      >
                        {room.equipmentCount}
                        {room.inRepair > 0 && <span className="text-warn"> · {room.inRepair} в рем.</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={room.mapStatus} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingRoom(room)}
                          className="mr-3 text-xs text-ink-faint hover:text-brand"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(room)}
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

      {isCreating && (
        <RoomFormModal
          room={null}
          floors={floors}
          employees={employees}
          defaultFloorId={floorFilter}
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingRoom && (
        <RoomFormModal
          room={editingRoom}
          floors={floors}
          employees={employees}
          onClose={() => setEditingRoom(null)}
          onSubmit={handleUpdate}
        />
      )}
    </AppShell>
  );
}