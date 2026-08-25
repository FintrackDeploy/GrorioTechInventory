import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { extractApiErrorMessage } from "../../api/client";
import { searchInventoryNumbers } from "../../api/equipmentApi";
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS } from "../../types/equipment";
import type {
  EquipmentBatchItemDraft,
  EquipmentBatchRequest,
  EquipmentStatus,
  EquipmentType,
  InventoryGroupSuggestion,
} from "../../types/equipment";
import type { RoomResponse } from "../../types/room";
import type { EmployeeResponse } from "../../types/employee";

const STATUSES = Object.keys(EQUIPMENT_STATUS_LABELS) as EquipmentStatus[];

// Типовой набор рабочего места — быстрые кнопки добавления единицы техники.
const QUICK_TYPES: EquipmentType[] = ["COMPUTER", "MONITOR", "KEYBOARD", "MOUSE", "PRINTER", "SPEAKERS"];

let draftIdSeq = 0;
function nextDraftId() {
  draftIdSeq += 1;
  return `draft-${draftIdSeq}`;
}

interface EquipmentGroupFormModalProps {
  rooms: RoomResponse[];
  employees: EmployeeResponse[];
  onClose: () => void;
  onSubmit: (payload: EquipmentBatchRequest) => Promise<void>;
}

export function EquipmentGroupFormModal({
  rooms,
  employees,
  onClose,
  onSubmit,
}: EquipmentGroupFormModalProps) {
  const [inventoryNumber, setInventoryNumber] = useState("");
  const [roomId, setRoomId] = useState("");
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [defaultStatus, setDefaultStatus] = useState<EquipmentStatus>("IN_USE");

  const [items, setItems] = useState<EquipmentBatchItemDraft[]>([]);
  const [suggestions, setSuggestions] = useState<InventoryGroupSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const labelClass = "tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft";

  useEffect(() => {
    if (!inventoryNumber.trim()) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      searchInventoryNumbers(inventoryNumber.trim()).then(setSuggestions).catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [inventoryNumber]);

  const exactMatch = suggestions.find((sgg) => sgg.inventoryNumber === inventoryNumber.trim());

  function applySuggestion(sgg: InventoryGroupSuggestion) {
    setInventoryNumber(sgg.inventoryNumber);
    if (sgg.roomId) setRoomId(String(sgg.roomId));
    if (sgg.responsibleEmployeeId) setResponsibleEmployeeId(String(sgg.responsibleEmployeeId));
  }

  function addItem(type: EquipmentType) {
    setItems((prev) => [...prev, { id: nextDraftId(), type, status: defaultStatus, notes: "" }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<EquipmentBatchItemDraft>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inventoryNumber.trim()) {
      setError("Инвентарный номер обязателен");
      return;
    }
    if (items.length === 0) {
      setError("Добавьте хотя бы одну единицу техники в комплект");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        inventoryNumber: inventoryNumber.trim(),
        items: items.map((item) => ({
          inventoryNumber: inventoryNumber.trim(),
          type: item.type,
          status: item.status,
          roomId: roomId ? Number(roomId) : null,
          responsibleEmployeeId: responsibleEmployeeId ? Number(responsibleEmployeeId) : null,
          purchaseDate: purchaseDate || null,
          ipAddress: null,
          macAddress: null,
          notes: item.notes.trim() || null,
          cpu: null,
          ramGb: null,
          storage: null,
          gpu: null,
          os: null,
          formFactor: null,
          diagonalInch: null,
          resolution: null,
          panelType: null,
          connectors: null,
          printSpeedPpm: null,
          printColor: null,
          printFormat: null,
          wireless: null,
          switchType: null,
          portCount: null,
          powerVa: null,
          batteryRuntimeMin: null,
        })),
      });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось создать комплект"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Новый комплект по одному инв. номеру" onClose={onClose} widthClassName="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <p className="text-xs text-ink-faint">
          Один инвентарный номер — несколько единиц техники (компьютер, монитор, клавиатура, мышь,
          принтер, колонки и т.п.). Кабинет, ответственный и дата покупки — общие для комплекта;
          статус и заметку можно задать для каждой единицы отдельно. Точные характеристики (CPU,
          IP и т.д.) добавите потом через «Изменить» у нужной единицы.
        </p>

        <div className="relative">
          <label htmlFor="grp-inv" className={labelClass}>Инвентарный номер</label>
          <input
            id="grp-inv"
            type="text"
            required
            value={inventoryNumber}
            onChange={(e) => setInventoryNumber(e.target.value)}
            placeholder="INV-0001"
            className={`${inputClass} tag-mono`}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-lg">
              {suggestions.map((sgg) => (
                <button
                  key={sgg.inventoryNumber}
                  type="button"
                  onClick={() => applySuggestion(sgg)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-neutral-soft"
                >
                  <span className="tag-mono text-ink">{sgg.inventoryNumber}</span>
                  <span className="text-ink-faint">
                    {sgg.itemsCount} ед.{sgg.roomNumber ? ` · каб. ${sgg.roomNumber}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
          {exactMatch && (
            <p className="mt-1.5 text-xs text-warn">
              Этот номер уже используется: {exactMatch.itemsCount} ед. техники
              {exactMatch.roomNumber ? `, каб. ${exactMatch.roomNumber}` : ""}. Новые единицы
              добавятся в этот же комплект.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="grp-room" className={labelClass}>Кабинет</label>
            <select id="grp-room" value={roomId} onChange={(e) => setRoomId(e.target.value)} className={inputClass}>
              <option value="">Не назначен</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} {r.floorNumber != null ? `(эт. ${r.floorNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="grp-employee" className={labelClass}>Ответственный</label>
            <select
              id="grp-employee"
              value={responsibleEmployeeId}
              onChange={(e) => setResponsibleEmployeeId(e.target.value)}
              className={inputClass}
            >
              <option value="">Не назначен</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="grp-date" className={labelClass}>Дата покупки</label>
            <input
              id="grp-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="grp-status" className={labelClass}>Статус по умолчанию</label>
            <select
              id="grp-status"
              value={defaultStatus}
              onChange={(e) => setDefaultStatus(e.target.value as EquipmentStatus)}
              className={inputClass}
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>{EQUIPMENT_STATUS_LABELS[st]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className={labelClass}>Добавить единицу техники</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {QUICK_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addItem(t)}
                className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-ink-soft hover:border-brand hover:text-brand"
              >
                + {EQUIPMENT_TYPE_LABELS[t]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => addItem("OTHER")}
              className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-ink-soft hover:border-brand hover:text-brand"
            >
              + Другое
            </button>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="space-y-2 rounded-md border border-line bg-canvas p-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-2"
              >
                <select
                  value={item.type}
                  onChange={(e) => updateItem(item.id, { type: e.target.value as EquipmentType })}
                  className="rounded border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand"
                >
                  {Object.entries(EQUIPMENT_TYPE_LABELS).map(([t, label]) => (
                    <option key={t} value={t}>{label}</option>
                  ))}
                </select>
                <select
                  value={item.status}
                  onChange={(e) => updateItem(item.id, { status: e.target.value as EquipmentStatus })}
                  className="rounded border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>{EQUIPMENT_STATUS_LABELS[st]}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                  placeholder="Модель / заметка (необязательно)"
                  className="flex-1 rounded border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-ink-faint hover:text-danger"
                  aria-label="Убрать из комплекта"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-faint">Комплект пока пуст — добавьте единицы техники выше.</p>
        )}

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
            disabled={isSubmitting || items.length === 0}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {isSubmitting ? "Создание…" : `Создать комплект (${items.length})`}
          </button>
        </div>
      </form>
    </Modal>
  );
}