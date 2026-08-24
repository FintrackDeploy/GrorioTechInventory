import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  ENGINEER: "Инженер",
  STAFF: "Сотрудник",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "border-danger/30 bg-danger-soft text-danger",
  ENGINEER: "border-brand/30 bg-brand-soft text-brand-strong",
  STAFF: "border-ok/30 bg-ok-soft text-ok",
};

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initials = user?.fullName
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() ?? "?";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <h1 className="text-sm font-semibold text-ink">{title}</h1>

      {user && (
        <div className="flex items-center gap-3">
          {/* Роль */}
          <span
            className={`tag-mono hidden rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide sm:inline-flex ${
              ROLE_COLORS[user.role] ?? "border-line bg-neutral-soft text-neutral"
            }`}
          >
            {ROLE_LABELS[user.role] ?? user.role}
          </span>

          {/* Аватар + имя */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-strong">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-ink sm:block">
              {user.fullName.split(" ")[0]}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            Выйти
          </button>
        </div>
      )}
    </header>
  );
}