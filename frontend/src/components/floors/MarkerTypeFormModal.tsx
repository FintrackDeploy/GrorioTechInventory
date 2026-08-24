import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { extractApiErrorMessage } from "../../api/client";
import type { MarkerKind, PlanMarkerTypeRequest, PlanMarkerTypeResponse } from "../../types/floorPlan";

const KIND_HINTS: Record<MarkerKind, string> = {
  POINT: "Точка — розетка, коммутатор, точка доступа и т.п.",
  LINE: "Линия — кабельная трасса, маршрут провода",
};

interface MarkerTypeFormModalProps {
  markerType: PlanMarkerTypeResponse | null; // null = создание
  onClose: () => void;
  onSubmit: (payload: PlanMarkerTypeRequest) => Promise<void>;
}

export function MarkerTypeFormModal({ markerType, onClose, onSubmit }: MarkerTypeFormModalProps) {
  const [name, setName] = useState(markerType?.name ?? "");
  const [color, setColor] = useState(markerType?.color ?? "#2563eb");
  const [kind, setKind] = useState<MarkerKind>(markerType?.kind ?? "POINT");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const labelClass = "tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Название обязательно");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color, kind });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось сохранить тип маркера"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={markerType ? "Изменить тип маркера" : "Новый тип маркера"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="mt-name" className={labelClass}>Название</label>
          <input
            id="mt-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Розетка 220В"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mt-color" className={labelClass}>Цвет</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="mt-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-line bg-white p-1"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="tag-mono w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                placeholder="#2563eb"
              />
            </div>
          </div>
          <div>
            <label htmlFor="mt-kind" className={labelClass}>Вид маркера</label>
            <select
              id="mt-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as MarkerKind)}
              className={inputClass}
            >
              <option value="POINT">Точка</option>
              <option value="LINE">Линия</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-ink-faint">{KIND_HINTS[kind]}</p>

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