import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../shared/Modal";
import { extractApiErrorMessage } from "../../api/client";
import { ROLE_LABELS } from "../../types/user";
import type { UserRequest, UserResponse } from "../../types/user";
import type { Role } from "../../types/auth";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

interface UserFormModalProps {
  user: UserResponse | null; // null = создание
  onClose: () => void;
  onSubmit: (payload: UserRequest) => Promise<void>;
}

export function UserFormModal({ user, onClose, onSubmit }: UserFormModalProps) {
  const isEdit = user !== null;
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "STAFF");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const labelClass = "tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError("Логин обязателен");
      return;
    }
    if (!fullName.trim()) {
      setError("ФИО обязательно");
      return;
    }
    if (!isEdit && password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }
    if (password && password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        username: username.trim(),
        password: password || null, // пусто при редактировании = не менять
        fullName: fullName.trim(),
        email: email.trim() || null,
        role,
        isActive,
      });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось сохранить пользователя"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? "Изменить пользователя" : "Новый пользователь"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="user-username" className={labelClass}>
              Логин
            </label>
            <input
              id="user-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${inputClass} tag-mono`}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="user-password" className={labelClass}>
              {isEdit ? "Новый пароль" : "Пароль"}
            </label>
            <input
              id="user-password"
              type="password"
              required={!isEdit}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Оставьте пустым, чтобы не менять" : "минимум 6 символов"}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div>
          <label htmlFor="user-fullname" className={labelClass}>
            ФИО
          </label>
          <input
            id="user-fullname"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="user-email" className={labelClass}>
              Email
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="user-role" className={labelClass}>
              Роль
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={inputClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
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
