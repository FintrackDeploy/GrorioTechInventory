import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { extractApiErrorMessage } from "../../api/client";
import { searchInventoryNumbers } from "../../api/equipmentApi";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_GROUPS,
  COMPUTER_TYPES,
  NETWORK_TYPES,
} from "../../types/equipment";
import type {
  EquipmentRequest,
  EquipmentResponse,
  EquipmentStatus,
  EquipmentType,
  InventoryGroupSuggestion,
} from "../../types/equipment";
import type { RoomResponse } from "../../types/room";
import type { EmployeeResponse } from "../../types/employee";

const STATUSES = Object.keys(EQUIPMENT_STATUS_LABELS) as EquipmentStatus[];

interface EquipmentFormModalProps {
  equipment: EquipmentResponse | null;
  rooms: RoomResponse[];
  employees: EmployeeResponse[];
  onClose: () => void;
  onSubmit: (payload: EquipmentRequest) => Promise<void>;
}

function n(v: number | null | undefined): string {
  return v != null ? String(v) : "";
}
function s(v: string | null | undefined): string {
  return v ?? "";
}

export function EquipmentFormModal({
  equipment,
  rooms,
  employees,
  onClose,
  onSubmit,
}: EquipmentFormModalProps) {
  const [inventoryNumber, setInventoryNumber] = useState(equipment?.inventoryNumber ?? "");
  const [type, setType] = useState<EquipmentType>(equipment?.type ?? "COMPUTER");
  const [status, setStatus] = useState<EquipmentStatus>(equipment?.status ?? "IN_USE");
  const [roomId, setRoomId] = useState(equipment?.roomId ? String(equipment.roomId) : "");
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState(
    equipment?.responsibleEmployeeId ? String(equipment.responsibleEmployeeId) : "",
  );
  const [purchaseDate, setPurchaseDate] = useState(s(equipment?.purchaseDate));
  const [ipAddress, setIpAddress] = useState(s(equipment?.ipAddress));
  const [macAddress, setMacAddress] = useState(s(equipment?.macAddress));
  const [notes, setNotes] = useState(s(equipment?.notes));

  // ПК
  const [cpu, setCpu] = useState(s(equipment?.cpu));
  const [ramGb, setRamGb] = useState(n(equipment?.ramGb));
  const [storage, setStorage] = useState(s(equipment?.storage));
  const [gpu, setGpu] = useState(s(equipment?.gpu));
  const [os, setOs] = useState(s(equipment?.os));
  const [formFactor, setFormFactor] = useState(s(equipment?.formFactor));

  // Монитор / Проектор
  const [diagonalInch, setDiagonalInch] = useState(n(equipment?.diagonalInch));
  const [resolution, setResolution] = useState(s(equipment?.resolution));
  const [panelType, setPanelType] = useState(s(equipment?.panelType));
  const [connectors, setConnectors] = useState(s(equipment?.connectors));

  // Принтер
  const [printSpeedPpm, setPrintSpeedPpm] = useState(n(equipment?.printSpeedPpm));
  const [printColor, setPrintColor] = useState(equipment?.printColor ?? false);
  const [printFormat, setPrintFormat] = useState(s(equipment?.printFormat));

  // Мышь / Клавиатура
  const [wireless, setWireless] = useState(equipment?.wireless ?? false);

  // Клавиатура
  const [switchType, setSwitchType] = useState(s(equipment?.switchType));

  // Сеть / ИБП
  const [portCount, setPortCount] = useState(n(equipment?.portCount));
  const [powerVa, setPowerVa] = useState(n(equipment?.powerVa));
  const [batteryRuntimeMin, setBatteryRuntimeMin] = useState(n(equipment?.batteryRuntimeMin));

  // Автоподсказка по инвентарному номеру — показывает, что номер уже
  // используется другим комплектом, и позволяет подставить его кабинет/
  // ответственного, чтобы новая единица легла в тот же комплект.
  const [inventorySuggestions, setInventorySuggestions] = useState<InventoryGroupSuggestion[]>([]);
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const labelClass =
    "tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft";

  const isComputer = COMPUTER_TYPES.includes(type);
  const isNetwork = NETWORK_TYPES.includes(type);
  const isMonitor = type === "MONITOR" || type === "PROJECTOR";
  const isPrinter = type === "PRINTER" || type === "MFP" || type === "SCANNER";
  const isMouse = type === "MOUSE";
  const isKeyboard = type === "KEYBOARD";
  const isSwitch = type === "SWITCH" || type === "ROUTER" || type === "ACCESS_POINT";
  const isUps = type === "UPS";

  useEffect(() => {
    if (!inventoryNumber.trim()) {
      setInventorySuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      searchInventoryNumbers(inventoryNumber.trim())
        .then(setInventorySuggestions)
        .catch(() => setInventorySuggestions([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [inventoryNumber]);

  const exactMatch = inventorySuggestions.find(
    (sgg) => sgg.inventoryNumber === inventoryNumber.trim() && sgg.inventoryNumber !== equipment?.inventoryNumber,
  );

  function applySuggestion(sgg: InventoryGroupSuggestion) {
    setInventoryNumber(sgg.inventoryNumber);
    if (sgg.roomId) setRoomId(String(sgg.roomId));
    if (sgg.responsibleEmployeeId) setResponsibleEmployeeId(String(sgg.responsibleEmployeeId));
    setIsInventoryDropdownOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!inventoryNumber.trim()) {
      setError("Инвентарный номер обязателен");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        inventoryNumber: inventoryNumber.trim(),
        type,
        status,
        roomId: roomId ? Number(roomId) : null,
        responsibleEmployeeId: responsibleEmployeeId ? Number(responsibleEmployeeId) : null,
        purchaseDate: purchaseDate || null,
        ipAddress: ipAddress.trim() || null,
        macAddress: macAddress.trim() || null,
        notes: notes.trim() || null,
        cpu: cpu.trim() || null,
        ramGb: ramGb ? Number(ramGb) : null,
        storage: storage.trim() || null,
        gpu: gpu.trim() || null,
        os: os.trim() || null,
        formFactor: formFactor.trim() || null,
        diagonalInch: diagonalInch ? Number(diagonalInch) : null,
        resolution: resolution.trim() || null,
        panelType: panelType.trim() || null,
        connectors: connectors.trim() || null,
        printSpeedPpm: printSpeedPpm ? Number(printSpeedPpm) : null,
        printColor: isPrinter ? printColor : null,
        printFormat: printFormat.trim() || null,
        wireless: (isMouse || isKeyboard) ? wireless : null,
        switchType: switchType.trim() || null,
        portCount: portCount ? Number(portCount) : null,
        powerVa: powerVa ? Number(powerVa) : null,
        batteryRuntimeMin: batteryRuntimeMin ? Number(batteryRuntimeMin) : null,
      });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось сохранить оборудование"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={equipment ? "Изменить оборудование" : "Новое оборудование"}
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* ── Основные ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="relative">
            <label htmlFor="eq-inv" className={labelClass}>Инв. номер</label>
            <input
              id="eq-inv"
              type="text"
              required
              value={inventoryNumber}
              onChange={(e) => {
                setInventoryNumber(e.target.value);
                setIsInventoryDropdownOpen(true);
              }}
              onFocus={() => setIsInventoryDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsInventoryDropdownOpen(false), 150)}
              className={`${inputClass} tag-mono`}
              placeholder="INV-0001"
              autoComplete="off"
            />
            {isInventoryDropdownOpen && inventorySuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-40 w-56 overflow-y-auto rounded-md border border-line bg-surface shadow-lg">
                {inventorySuggestions.map((sgg) => (
                  <button
                    key={sgg.inventoryNumber}
                    type="button"
                    onMouseDown={() => applySuggestion(sgg)}
                    className="flex w-full flex-col items-start px-3 py-1.5 text-left text-xs hover:bg-neutral-soft"
                  >
                    <span className="tag-mono text-ink">{sgg.inventoryNumber}</span>
                    <span className="text-ink-faint">
                      {sgg.itemsCount} ед.{sgg.roomNumber ? ` · каб. ${sgg.roomNumber}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="eq-type" className={labelClass}>Тип</label>
            <select
              id="eq-type"
              value={type}
              onChange={(e) => setType(e.target.value as EquipmentType)}
              className={inputClass}
            >
              {EQUIPMENT_TYPE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.types.map((t) => (
                    <option key={t} value={t}>
                      {EQUIPMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="eq-status" className={labelClass}>Статус</label>
            <select
              id="eq-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
              className={inputClass}
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {EQUIPMENT_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {exactMatch && (
          <p className="-mt-3 text-xs text-warn">
            Инвентарный номер «{exactMatch.inventoryNumber}» уже используется: {exactMatch.itemsCount}{" "}
            ед. техники{exactMatch.roomNumber ? `, каб. ${exactMatch.roomNumber}` : ""}. Эта единица
            добавится в тот же комплект.
          </p>
        )}

        {/* ── Размещение ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="eq-room" className={labelClass}>Кабинет</label>
            <select
              id="eq-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
            >
              <option value="">Не назначен</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} {r.floorNumber != null ? `(эт. ${r.floorNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="eq-employee" className={labelClass}>Ответственный</label>
            <select
              id="eq-employee"
              value={responsibleEmployeeId}
              onChange={(e) => setResponsibleEmployeeId(e.target.value)}
              className={inputClass}
            >
              <option value="">Не назначен</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Дата покупки ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="eq-purchase" className={labelClass}>Дата покупки</label>
            <input
              id="eq-purchase"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* ── IP / MAC только для сетевых ── */}
        {isNetwork && (
          <div className="grid grid-cols-2 gap-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div>
              <label htmlFor="eq-ip" className={labelClass}>IP-адрес</label>
              <input
                id="eq-ip"
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.10"
                className={`${inputClass} tag-mono`}
              />
            </div>
            <div>
              <label htmlFor="eq-mac" className={labelClass}>MAC-адрес</label>
              <input
                id="eq-mac"
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="00:1A:2B:3C:4D:5E"
                className={`${inputClass} tag-mono`}
              />
            </div>
          </div>
        )}

        {/* ── Спецификации ПК / Ноутбук / Сервер ── */}
        {isComputer && (
          <div className="space-y-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div className="tag-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Комплектующие</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Процессор (CPU)</label>
                <input
                  type="text"
                  value={cpu}
                  onChange={(e) => setCpu(e.target.value)}
                  placeholder="Intel Core i5-12400"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>ОЗУ (ГБ)</label>
                <input
                  type="number"
                  min="0"
                  value={ramGb}
                  onChange={(e) => setRamGb(e.target.value)}
                  placeholder="16"
                  className={`${inputClass} tag-mono`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Накопитель</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="SSD 512 ГБ"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Видеокарта (GPU)</label>
                <input
                  type="text"
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value)}
                  placeholder="Intel UHD 770"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>ОС</label>
                <input
                  type="text"
                  value={os}
                  onChange={(e) => setOs(e.target.value)}
                  placeholder="Windows 11 Pro"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Форм-фактор</label>
                <input
                  type="text"
                  value={formFactor}
                  onChange={(e) => setFormFactor(e.target.value)}
                  placeholder="Системный блок / Моноблок"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Монитор / Проектор ── */}
        {isMonitor && (
          <div className="space-y-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div className="tag-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Характеристики экрана</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Диагональ (дюймы)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={diagonalInch}
                  onChange={(e) => setDiagonalInch(e.target.value)}
                  placeholder="24.0"
                  className={`${inputClass} tag-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Разрешение</label>
                <input
                  type="text"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="1920×1080"
                  className={`${inputClass} tag-mono`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Тип матрицы</label>
                <input
                  type="text"
                  value={panelType}
                  onChange={(e) => setPanelType(e.target.value)}
                  placeholder="IPS / VA / TN"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Разъёмы</label>
                <input
                  type="text"
                  value={connectors}
                  onChange={(e) => setConnectors(e.target.value)}
                  placeholder="VGA, HDMI, DisplayPort"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Принтер / МФУ / Сканер ── */}
        {isPrinter && (
          <div className="space-y-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div className="tag-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Характеристики печати</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Скорость (стр/мин)</label>
                <input
                  type="number"
                  min="0"
                  value={printSpeedPpm}
                  onChange={(e) => setPrintSpeedPpm(e.target.value)}
                  placeholder="20"
                  className={`${inputClass} tag-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Формат</label>
                <input
                  type="text"
                  value={printFormat}
                  onChange={(e) => setPrintFormat(e.target.value)}
                  placeholder="A4 / A3"
                  className={`${inputClass} tag-mono`}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={printColor}
                    onChange={(e) => setPrintColor(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  Цветная печать
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── Мышь ── */}
        {isMouse && (
          <div className="space-y-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div className="tag-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Мышь</div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={wireless}
                onChange={(e) => setWireless(e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
              />
              Беспроводная
            </label>
          </div>
        )}

        {/* ── Клавиатура ── */}
        {isKeyboard && (
          <div className="space-y-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div className="tag-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Характеристики клавиатуры</div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className={labelClass}>Тип переключателей</label>
                <input
                  type="text"
                  value={switchType}
                  onChange={(e) => setSwitchType(e.target.value)}
                  placeholder="Мембранные / Cherry MX Red"
                  className={inputClass}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={wireless}
                    onChange={(e) => setWireless(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  Беспроводная
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── Коммутатор / Роутер ── */}
        {isSwitch && (
          <div className="space-y-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div className="tag-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Сетевые характеристики</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Количество портов</label>
                <input
                  type="number"
                  min="0"
                  value={portCount}
                  onChange={(e) => setPortCount(e.target.value)}
                  placeholder="24"
                  className={`${inputClass} tag-mono`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── ИБП ── */}
        {isUps && (
          <div className="space-y-3 rounded-md border border-line bg-canvas px-3 pt-3 pb-2">
            <div className="tag-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Характеристики ИБП</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Мощность (ВА)</label>
                <input
                  type="number"
                  min="0"
                  value={powerVa}
                  onChange={(e) => setPowerVa(e.target.value)}
                  placeholder="1000"
                  className={`${inputClass} tag-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Время работы (мин)</label>
                <input
                  type="number"
                  min="0"
                  value={batteryRuntimeMin}
                  onChange={(e) => setBatteryRuntimeMin(e.target.value)}
                  placeholder="15"
                  className={`${inputClass} tag-mono`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Примечания ── */}
        <div>
          <label htmlFor="eq-notes" className={labelClass}>Примечания</label>
          <textarea
            id="eq-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
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