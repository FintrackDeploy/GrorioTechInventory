import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";
import { fetchFloors } from "../api/floorApi";
import type { FloorResponse } from "../types/floor";

interface DashboardSummary {
  totalFloors: number;
  totalRooms: number;
  roomsOk: number;
  roomsWarning: number;
  roomsCritical: number;
  roomsEmpty: number;
  totalEquipment: number;
  equipmentInUse: number;
  equipmentRepair: number;
  equipmentStorage: number;
  equipmentWrittenOff: number;
  openWorkLogs: number;
  inProgressWorkLogs: number;
}

function RingChart({
  value,
  max,
  color,
  size = 80,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const dash = pct * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fontFamily="IBM Plex Mono, monospace"
        fill="var(--color-ink)"
      >
        {value}
      </text>
    </svg>
  );
}

function BarSegment({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div
      title={label}
      className="relative h-full min-w-[4px] rounded-sm transition-all"
      style={{ width: `${Math.max(pct * 100, 1)}%`, background: color }}
    />
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = "neutral",
  to,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "brand" | "ok" | "warn" | "danger" | "neutral";
  to?: string;
}) {
  const accentMap = {
    brand: "text-brand-strong",
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-danger",
    neutral: "text-ink",
  };

  const inner = (
    <div className="rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm">
      <div className="tag-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">{label}</div>
      <div className={`tag-mono mt-2 text-3xl font-semibold ${accentMap[accent]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-faint">{sub}</div>}
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [floors, setFloors] = useState<FloorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [{ data: s }, fl] = await Promise.all([
          apiClient.get<DashboardSummary>("/dashboard/summary"),
          fetchFloors(),
        ]);
        setSummary(s);
        setFloors(fl);
      } catch {
        setError("Не удалось загрузить сводку. Попробуйте обновить страницу.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const activeReports = summary ? summary.openWorkLogs + summary.inProgressWorkLogs : 0;

  return (
    <AppShell title="Дашборд">
      {/* Приветствие */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">
            Добро пожаловать, {user?.fullName?.split(" ")[0] ?? "коллега"}
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Сводка по инвентарю института · {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-faint">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-line border-t-brand" />
          Загрузка…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* ── Топ-метрики ── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Этажей"
              value={summary.totalFloors}
              sub="в здании"
              to="/floors"
            />
            <StatCard
              label="Кабинетов"
              value={summary.totalRooms}
              sub={`${summary.roomsOk} в норме · ${summary.roomsWarning} внимание`}
              accent={summary.roomsCritical > 0 ? "danger" : "neutral"}
              to="/rooms"
            />
            <StatCard
              label="Единиц техники"
              value={summary.totalEquipment}
              sub={`${summary.equipmentInUse} в работе`}
              accent="brand"
              to="/equipment"
            />
            <StatCard
              label="Активных отчётов"
              value={activeReports}
              sub={`${summary.openWorkLogs} открыто · ${summary.inProgressWorkLogs} в работе`}
              accent={activeReports > 0 ? "warn" : "ok"}
              to="/reports"
            />
          </div>

          {/* ── Два блока: кабинеты + техника ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Кабинеты по статусу */}
            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Кабинеты по статусу</h3>
                <Link to="/rooms" className="text-xs text-brand hover:text-brand-strong">
                  Все кабинеты →
                </Link>
              </div>

              {/* Стекбар */}
              <div className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-line">
                {summary.totalRooms > 0 && (
                  <>
                    <BarSegment
                      pct={summary.roomsOk / summary.totalRooms}
                      color="var(--color-ok)"
                      label={`Норма: ${summary.roomsOk}`}
                    />
                    <BarSegment
                      pct={summary.roomsWarning / summary.totalRooms}
                      color="var(--color-warn)"
                      label={`Внимание: ${summary.roomsWarning}`}
                    />
                    <BarSegment
                      pct={summary.roomsCritical / summary.totalRooms}
                      color="var(--color-danger)"
                      label={`Критично: ${summary.roomsCritical}`}
                    />
                    <BarSegment
                      pct={summary.roomsEmpty / summary.totalRooms}
                      color="var(--color-neutral)"
                      label={`Пусто: ${summary.roomsEmpty}`}
                    />
                  </>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Норма", value: summary.roomsOk, color: "bg-ok-soft text-ok border-ok/30" },
                  { label: "Внимание", value: summary.roomsWarning, color: "bg-warn-soft text-warn border-warn/30" },
                  { label: "Критично", value: summary.roomsCritical, color: "bg-danger-soft text-danger border-danger/30" },
                  { label: "Пусто", value: summary.roomsEmpty, color: "bg-neutral-soft text-neutral border-neutral/30" },
                ].map((s) => (
                  <div key={s.label} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${s.color}`}>
                    <span className="tag-mono text-[11px] uppercase tracking-wide">{s.label}</span>
                    <span className="tag-mono text-lg font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Техника по статусу */}
            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Техника по статусу</h3>
                <Link to="/equipment" className="text-xs text-brand hover:text-brand-strong">
                  Все оборудование →
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-6">
                <RingChart
                  value={summary.equipmentInUse}
                  max={summary.totalEquipment}
                  color="var(--color-ok)"
                  size={90}
                />
                <div className="flex-1 space-y-2">
                  {[
                    { label: "В эксплуатации", value: summary.equipmentInUse, color: "bg-ok" },
                    { label: "В ремонте", value: summary.equipmentRepair, color: "bg-warn" },
                    { label: "На складе", value: summary.equipmentStorage, color: "bg-neutral" },
                    { label: "Списано", value: summary.equipmentWrittenOff, color: "bg-danger" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className={`h-2 w-2 flex-shrink-0 rounded-full ${s.color}`} />
                      <span className="flex-1 text-xs text-ink-soft">{s.label}</span>
                      <span className="tag-mono text-xs font-medium text-ink">{s.value}</span>
                      {summary.totalEquipment > 0 && (
                        <span className="tag-mono w-8 text-right text-[10px] text-ink-faint">
                          {Math.round((s.value / summary.totalEquipment) * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Полоска прогресса "исправно" */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-ink-faint">
                  <span>Рабочее состояние</span>
                  <span className="tag-mono">
                    {summary.totalEquipment > 0
                      ? Math.round((summary.equipmentInUse / summary.totalEquipment) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-ok transition-all"
                    style={{
                      width: summary.totalEquipment > 0
                        ? `${(summary.equipmentInUse / summary.totalEquipment) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Этажи ── */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Этажи</h3>
              <Link to="/floors" className="text-xs text-brand hover:text-brand-strong">
                Открыть планы →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {floors.map((f) => (
                <Link
                  key={f.id}
                  to="/floors"
                  className="group rounded-lg border border-line bg-canvas px-3 py-3 transition-all hover:border-brand hover:bg-brand-soft"
                >
                  <div className="tag-mono text-[11px] text-ink-faint group-hover:text-brand">
                    №{f.number}
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-ink-soft group-hover:text-brand-strong">
                    {f.name || `Этаж ${f.number}`}
                  </div>
                  <div className="tag-mono mt-2 text-xs text-ink-faint">{f.roomsCount} каб.</div>
                </Link>
              ))}
              {floors.length === 0 && (
                <div className="col-span-full py-4 text-center text-sm text-ink-faint">
                  Этажей пока нет
                </div>
              )}
            </div>
          </div>

          {/* ── Быстрые ссылки ── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { to: "/rooms", label: "Кабинеты", desc: "Просмотр и управление", tag: "RM" },
              { to: "/equipment", label: "Оборудование", desc: "Инвентарный учёт", tag: "EQ" },
              { to: "/reports", label: "Отчёты", desc: "История работ", tag: "RPT" },
              { to: "/employees", label: "Сотрудники", desc: "Список персонала", tag: "EMP" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-all hover:border-brand hover:bg-brand-soft"
              >
                <span className="tag-mono flex h-8 w-10 shrink-0 items-center justify-center rounded border border-line text-[10px] text-ink-faint transition-colors group-hover:border-brand/40 group-hover:text-brand">
                  {item.tag}
                </span>
                <div>
                  <div className="text-sm font-medium text-ink group-hover:text-brand-strong">
                    {item.label}
                  </div>
                  <div className="text-xs text-ink-faint">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}