import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { extractApiErrorMessage } from "../../api/client";
import type { EmployeeRequest, EmployeeResponse } from "../../types/employee";

interface EmployeeFormModalProps {
  employee: EmployeeResponse | null; // null = создание
  onClose: () => void;
  onSubmit: (payload: EmployeeRequest) => Promise<void>;
}

export function EmployeeFormModal({ employee, onClose, onSubmit }: EmployeeFormModalProps) {
  const [fullName, setFullName] = useState(employee?.fullName ?? "");
  const [position, setPosition] = useState(employee?.position ?? "");
  const [department, setDepartment] = useState(employee?.department ?? "");
  const [internalPhone, setInternalPhone] = useState(employee?.internalPhone ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [isActive, setIsActive] = useState(employee?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const labelClass = "tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("ФИО обязательно");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        position: position.trim() || null,
        department: department.trim() || null,
        internalPhone: internalPhone.trim() || null,
        email: email.trim() || null,
        isActive,
      });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось сохранить сотрудника"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={employee ? "Изменить сотрудника" : "Новый сотрудник"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="emp-name" className={labelClass}>
            ФИО
          </label>
          <input
            id="emp-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="emp-position" className={labelClass}>
              Должность
            </label>
            <input
              id="emp-position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="emp-department" className={labelClass}>
              Отдел
            </label>
            <input
              id="emp-department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="emp-phone" className={labelClass}>
              Внутренний телефон
            </label>
            <input
              id="emp-phone"
              type="text"
              value={internalPhone}
              onChange={(e) => setInternalPhone(e.target.value)}
              className={`${inputClass} tag-mono`}
            />
          </div>
          <div>
            <label htmlFor="emp-email" className={labelClass}>
              Email
            </label>
            <input
              id="emp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
          />
          Активен
        </label>

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
