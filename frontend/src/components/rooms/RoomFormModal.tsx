import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { extractApiErrorMessage } from "../../api/client";
import type { RoomRequest, RoomResponse, RoomType } from "../../types/room";
import { ROOM_TYPE_LABELS } from "../../types/room";
import type { FloorResponse } from "../../types/floor";
import type { EmployeeResponse } from "../../types/employee";

const ROOM_TYPES = Object.keys(ROOM_TYPE_LABELS) as RoomType[];

interface RoomFormModalProps {
  room: RoomResponse | null;
  floors: FloorResponse[];
  employees: EmployeeResponse[];
  defaultFloorId?: number | null;
  onClose: () => void;
  onSubmit: (payload: RoomRequest) => Promise<void>;
}

export function RoomFormModal({
  room,
  floors,
  employees,
  defaultFloorId,
  onClose,
  onSubmit,
}: RoomFormModalProps) {
  const [floorId, setFloorId] = useState(
    room ? String(room.floorId ?? "") : String(defaultFloorId ?? floors[0]?.id ?? ""),
  );
  const [number, setNumber] = useState(room?.number ?? "");
  const [name, setName] = useState(room?.name ?? "");
  const [roomType, setRoomType] = useState<RoomType>(room?.roomType ?? "OFFICE");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(
    new Set(room?.employees?.map((e) => e.id) ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const labelClass =
    "tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft";

  function toggleEmployee(id: number) {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!floorId) {
      setError("Выберите этаж");
      return;
    }
    if (!number.trim()) {
      setError("Номер кабинета обязателен");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        floorId: Number(floorId),
        number: number.trim(),
        name: name.trim() || null,
        roomType,
        employeeIds: Array.from(selectedEmployeeIds),
      });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось сохранить кабинет"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={room ? "Изменить кабинет" : "Новый кабинет"}
      onClose={onClose}
      widthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="room-floor" className={labelClass}>
              Этаж
            </label>
            <select
              id="room-floor"
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              className={inputClass}
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  №{f.number} {f.name ? `— ${f.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="room-number" className={labelClass}>
              Номер кабинета
            </label>
            <input
              id="room-number"
              type="text"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="201"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="room-name" className={labelClass}>
            Название (необязательно)
          </label>
          <input
            id="room-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Лаборатория сетей"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="room-type" className={labelClass}>
            Тип помещения
          </label>
          <select
            id="room-type"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as RoomType)}
            className={inputClass}
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {ROOM_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Сотрудники кабинета</label>
          <div className="mt-1.5 max-h-44 overflow-y-auto rounded-md border border-line bg-white">
            {employees.length === 0 ? (
              <div className="px-3 py-3 text-sm text-ink-faint">Нет активных сотрудников</div>
            ) : (
              employees.map((emp) => (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-neutral-soft"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.has(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span className="text-ink">{emp.fullName}</span>
                  {emp.position && (
                    <span className="text-ink-faint">· {emp.position}</span>
                  )}
                </label>
              ))
            )}
          </div>
          {selectedEmployeeIds.size > 0 && (
            <div className="mt-1 text-xs text-ink-faint">
              Выбрано: {selectedEmployeeIds.size}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft hover:border-line-strong"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {isSubmitting ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}