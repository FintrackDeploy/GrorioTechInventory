import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractApiErrorMessage } from "../api/client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      setError(extractApiErrorMessage(err, "Неверный логин или пароль."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Левая: чертёж ── */}
      <div className="blueprint-grid relative hidden w-[45%] flex-col justify-between overflow-hidden bg-blueprint-950 p-10 text-white lg:flex">

        {/* Лого */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10">
            <span className="tag-mono text-[11px] font-semibold text-cyan">GTI</span>
          </div>
          <div>
            <div className="tag-mono text-[10px] uppercase tracking-[0.25em] text-cyan/70">
              Groiro Tech Inventory
            </div>
          </div>
        </div>

        {/* Иллюстрация — план этажа */}
        <div className="relative mx-auto w-full max-w-sm">
          <svg viewBox="0 0 480 320" className="w-full" fill="none" aria-hidden="true">
            {/* Внешняя рамка */}
            <rect x="10" y="10" width="460" height="300" rx="6"
              stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

            {/* Коридор */}
            <rect x="10" y="155" width="460" height="12"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            {/* Кабинет 201 — активный */}
            <polygon points="22,22 218,22 218,148 22,148"
              stroke="#3b82f6" strokeWidth="1.8" fill="rgba(59,130,246,0.09)" />
            <text x="34" y="38" fill="rgba(255,255,255,0.5)" fontSize="11"
              fontFamily="IBM Plex Mono,monospace">201</text>
            <circle cx="80" cy="80" r="3.5" fill="#3b82f6" opacity="0.9" />
            <circle cx="140" cy="100" r="3.5" fill="#3b82f6" opacity="0.9" />
            <circle cx="180" cy="60" r="3.5" fill="#3b82f6" opacity="0.9" />
            <line x1="80" y1="80" x2="140" y2="100"
              stroke="rgba(59,130,246,0.35)" strokeWidth="1" strokeDasharray="4 3" />
            <line x1="140" y1="100" x2="180" y2="60"
              stroke="rgba(59,130,246,0.35)" strokeWidth="1" strokeDasharray="4 3" />

            {/* Кабинет 202 */}
            <polygon points="230,22 468,22 468,90 230,90"
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="rgba(255,255,255,0.03)" />
            <text x="242" y="38" fill="rgba(255,255,255,0.35)" fontSize="11"
              fontFamily="IBM Plex Mono,monospace">202</text>
            <circle cx="350" cy="60" r="3" fill="rgba(255,255,255,0.3)" />

            {/* Кабинет 203 — ремонт */}
            <polygon points="230,100 370,100 370,148 230,148"
              stroke="#d97706" strokeWidth="1.8" fill="rgba(217,119,6,0.09)" />
            <text x="242" y="116" fill="rgba(255,255,255,0.5)" fontSize="11"
              fontFamily="IBM Plex Mono,monospace">203</text>
            <circle cx="290" cy="130" r="3.5" fill="#d97706" opacity="0.9" />

            {/* Кабинет 204 */}
            <polygon points="22,175 218,175 218,308 22,308"
              stroke="#16a34a" strokeWidth="1.8" fill="rgba(22,163,74,0.09)" />
            <text x="34" y="191" fill="rgba(255,255,255,0.5)" fontSize="11"
              fontFamily="IBM Plex Mono,monospace">204</text>
            <circle cx="70" cy="240" r="3.5" fill="#16a34a" opacity="0.9" />
            <circle cx="130" cy="260" r="3.5" fill="#16a34a" opacity="0.9" />

            {/* Кабинет 205 */}
            <polygon points="230,175 468,175 468,308 230,308"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="rgba(255,255,255,0.025)" />
            <text x="242" y="191" fill="rgba(255,255,255,0.3)" fontSize="11"
              fontFamily="IBM Plex Mono,monospace">205</text>

            {/* Легенда */}
            <circle cx="22" cy="315" r="3" fill="#3b82f6" />
            <text x="30" y="319" fill="rgba(255,255,255,0.35)" fontSize="9"
              fontFamily="IBM Plex Mono,monospace">В РАБОТЕ</text>
            <circle cx="100" cy="315" r="3" fill="#d97706" />
            <text x="108" y="319" fill="rgba(255,255,255,0.35)" fontSize="9"
              fontFamily="IBM Plex Mono,monospace">РЕМОНТ</text>
            <circle cx="170" cy="315" r="3" fill="#16a34a" />
            <text x="178" y="319" fill="rgba(255,255,255,0.35)" fontSize="9"
              fontFamily="IBM Plex Mono,monospace">НОРМА</text>
          </svg>
        </div>

        {/* Описание */}
        <p className="max-w-xs text-sm leading-relaxed text-white/50">
          Планы этажей, кабинеты, оборудование и отчёты о технических работах — в единой системе учёта института.
        </p>
      </div>

      {/* ── Правая: форма входа ── */}
      <div className="flex w-full flex-1 items-center justify-center bg-surface px-6">
        <div className="w-full max-w-sm">

          {/* Мобильный лого */}
          <div className="mb-1 flex items-center gap-2 lg:hidden">
            <span className="tag-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">GTI</span>
          </div>

          <div className="mb-8">
            <div className="tag-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              Вход в систему
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold text-ink">
              Учёт техники
            </h1>
            <p className="mt-1 text-sm text-ink-soft">Groiro Tech Inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username"
                className="tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                Логин
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
                placeholder="admin"
              />
            </div>

            <div>
              <label htmlFor="password"
                className="tag-mono block text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Вход…
                </span>
              ) : "Войти"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-faint">
            GTI-INV / v2.0 · Институт
          </p>
        </div>
      </div>
    </div>
  );
}