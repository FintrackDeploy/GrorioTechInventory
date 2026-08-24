import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { extractApiErrorMessage } from "../../api/client";
import type { FloorRequest, FloorResponse } from "../../types/floor";

interface FloorFormModalProps {
  floor: FloorResponse | null; // null = создание нового этажа
  onClose: () => void;
  onSubmit: (payload: FloorRequest) => Promise<void>;
}

export function FloorFormModal({ floor, onClose, onSubmit }: FloorFormModalProps) {
  const [number, setNumber] = useState(floor ? String(floor.number) : "");
  const [name, setName] = useState(floor?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedNumber = Number(number);
    if (!Number.isInteger(parsedNumber)) {
      setError("Номер этажа должен быть целым числом");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ number: parsedNumber, name: name.trim() || null });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось сохранить этаж"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={floor ? "Изменить этаж" : "Новый этаж"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="floor-number" className="tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Номер этажа
          </label>
          <input
            id="floor-number"
            type="number"
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />
        </div>

        <div>
          <label htmlFor="floor-name" className="tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Название (необязательно)
          </label>
          <input
            id="floor-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Учебный корпус"
            className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
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
