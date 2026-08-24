import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Pagination } from "../components/shared/Pagination";
import { UserFormModal } from "../components/users/UserFormModal";
import { useAuth } from "../context/AuthContext";
import { createUser, deleteUser, fetchUsersPage, updateUser } from "../api/userApi";
import { extractApiErrorMessage } from "../api/client";
import { ROLE_LABELS } from "../types/user";
import type { UserRequest, UserResponse } from "../types/user";
import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;

export function UsersPage() {
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<UserResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchUsersPage(page, PAGE_SIZE);
      setData(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось загрузить пользователей"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleCreate(payload: UserRequest) {
    await createUser(payload);
    setPage(0);
    await load();
  }

  async function handleUpdate(payload: UserRequest) {
    if (!editingUser) return;
    await updateUser(editingUser.id, payload);
    await load();
  }

  async function handleDelete(u: UserResponse) {
    if (u.username === currentUser?.username) {
      window.alert("Нельзя удалить самого себя");
      return;
    }
    if (!window.confirm(`Удалить пользователя ${u.username}?`)) return;
    try {
      await deleteUser(u.id);
      await load();
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось удалить пользователя"));
    }
  }

  return (
    <AppShell title="Пользователи">
      <div className="rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Учётные записи системы</h2>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
          >
            + Пользователь
          </button>
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
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Логин</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">ФИО</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Email</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Роль</th>
                <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Статус</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                    Загрузка…
                  </td>
                </tr>
              )}
              {!isLoading && data?.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                    Пользователей не найдено
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.content.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-neutral-soft/50">
                    <td className="tag-mono px-4 py-2.5 text-ink">
                      {u.username}
                      {u.username === currentUser?.username && (
                        <span className="ml-1.5 text-[10px] text-ink-faint">(вы)</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{u.fullName}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{u.email || "—"}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{ROLE_LABELS[u.role]}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`tag-mono inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                          u.isActive
                            ? "border-ok/30 bg-ok-soft text-ok"
                            : "border-neutral/30 bg-neutral-soft text-neutral"
                        }`}
                      >
                        {u.isActive ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="mr-3 text-xs text-ink-faint hover:text-brand"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="text-xs text-ink-faint hover:text-danger"
                      >
                        Удалить
                      </button>
                    </td>
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
        <UserFormModal user={null} onClose={() => setIsCreating(false)} onSubmit={handleCreate} />
      )}
      {editingUser && (
        <UserFormModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdate}
        />
      )}
    </AppShell>
  );
}
