import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { EquipmentPicker } from "./EquipmentPicker";
import { extractApiErrorMessage } from "../../api/client";
import { fetchAllUsers } from "../../api/userApi";
import { WORK_STATUS_LABELS, WORK_TYPE_LABELS } from "../../types/worklog";
import type { WorkLogRequest, WorkLogResponse, WorkStatus, WorkType } from "../../types/worklog";
import type { EquipmentResponse } from "../../types/equipment";
import type { UserResponse } from "../../types/user";
import type { Role } from "../../types/auth";

const TYPES = Object.keys(WORK_TYPE_LABELS) as WorkType[];
const STATUSES = Object.keys(WORK_STATUS_LABELS) as WorkStatus[];

interface WorkLogFormModalProps {
  workLog: WorkLogResponse | null;
  currentUserRole: Role;
  onClose: () => void;
  onSubmit: (payload: WorkLogRequest) => Promise<void>;
}

function toDatetimeLocal(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

export function WorkLogFormModal({
  workLog,
  currentUserRole,
  onClose,
  onSubmit,
}: WorkLogFormModalProps) {
  const [equipment, setEquipment] = useState<EquipmentResponse | null>(
    workLog
      ? ({ id: workLog.equipmentId, inventoryNumber: workLog.equipmentInventoryNumber } as EquipmentResponse)
      : null,
  );
  const [workType, setWorkType] = useState<WorkType>(workLog?.workType ?? "REPAIR");
  const [description, setDescription] = useState(workLog?.description ?? "");
  const [status, setStatus] = useState<WorkStatus>(workLog?.status ?? "OPEN");
  const [executorId, setExecutorId] = useState(workLog?.executorId ? String(workLog.executorId) : "");
  const [requestedById, setRequestedById] = useState(
    workLog?.requestedById ? String(workLog.requestedById) : "",
  );
  const [startedAt, setStartedAt] = useState(toDatetimeLocal(workLog?.startedAt ?? null));
  const [finishedAt, setFinishedAt] = useState(toDatetimeLocal(workLog?.finishedAt ?? null));
  const [timeSpentMinutes, setTimeSpentMinutes] = useState(
    workLog?.timeSpentMinutes != null ? String(workLog.timeSpentMinutes) : "",
  );
  const [usedParts, setUsedParts] = useState(workLog?.usedParts ?? "");

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUserRole === "ADMIN";
  currentUserRole === "ADMIN" || currentUserRole === "ENGINEER";

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers().then(setUsers).catch(() => setUsers([]));
    }
  }, [isAdmin]);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const labelClass =
    "tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!equipment) {
      setError("Выберите оборудование");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        equipmentId: equipment.id,
        workType,
        description: description.trim() || null,
        status,
        executorId: executorId ? Number(executorId) : null,
        requestedById: requestedById ? Number(requestedById) : null,
        startedAt: startedAt || null,
        finishedAt: finishedAt || null,
        timeSpentMinutes: timeSpentMinutes ? Number(timeSpentMinutes) : null,
        usedParts: usedParts.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось сохранить отчёт"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={workLog ? "Изменить отчёт" : "Новый отчёт о работах"}
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        {/* Оборудование */}
        <div>
          <label className={labelClass}>Оборудование</label>
          <div className="mt-1.5">
            <EquipmentPicker value={equipment} onChange={setEquipment} />
          </div>
        </div>

        {/* Тип и статус */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="wl-type" className={labelClass}>Тип работы</label>
            <select
              id="wl-type"
              value={workType}
              onChange={(e) => setWorkType(e.target.value as WorkType)}
              className={inputClass}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{WORK_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wl-status" className={labelClass}>Статус</label>
            <select
              id="wl-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkStatus)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{WORK_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Описание */}
        <div>
          <label htmlFor="wl-description" className={labelClass}>Описание работ</label>
          <textarea
            id="wl-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Что было сделано, какие проблемы обнаружены…"
            className={inputClass}
          />
        </div>

        {/* Исполнитель / заявитель (только ADMIN) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="wl-executor" className={labelClass}>Исполнитель</label>
            {isAdmin ? (
              <select
                id="wl-executor"
                value={executorId}
                onChange={(e) => setExecutorId(e.target.value)}
                className={inputClass}
              >
                <option value="">Не назначен</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            ) : (
              <div className="mt-1.5 rounded-md border border-dashed border-line px-3 py-2 text-xs text-ink-faint">
                Назначает администратор
              </div>
            )}
          </div>
          <div>
            <label htmlFor="wl-requester" className={labelClass}>Заявитель</label>
            {isAdmin ? (
              <select
                id="wl-requester"
                value={requestedById}
                onChange={(e) => setRequestedById(e.target.value)}
                className={inputClass}
              >
                <option value="">Не указан</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            ) : (
              <div className="mt-1.5 rounded-md border border-dashed border-line px-3 py-2 text-xs text-ink-faint">
                Заполняет администратор
              </div>
            )}
          </div>
        </div>

        {/* Время */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="wl-started" className={labelClass}>Начало</label>
            <input
              id="wl-started"
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className={`${inputClass} tag-mono`}
            />
          </div>
          <div>
            <label htmlFor="wl-finished" className={labelClass}>Завершение</label>
            <input
              id="wl-finished"
              type="datetime-local"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
              className={`${inputClass} tag-mono`}
            />
          </div>
          <div>
            <label htmlFor="wl-minutes" className={labelClass}>Затрачено, мин</label>
            <input
              id="wl-minutes"
              type="number"
              min="0"
              value={timeSpentMinutes}
              onChange={(e) => setTimeSpentMinutes(e.target.value)}
              placeholder="60"
              className={`${inputClass} tag-mono`}
            />
          </div>
        </div>

        {/* Запчасти */}
        <div>
          <label htmlFor="wl-parts" className={labelClass}>Использованные запчасти</label>
          <input
            id="wl-parts"
            type="text"
            value={usedParts}
            onChange={(e) => setUsedParts(e.target.value)}
            placeholder="Термопаста, вентилятор CPU…"
            className={inputClass}
          />
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