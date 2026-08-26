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

type Accent =
  | "brand"
  | "ok"
  | "warn"
  | "danger"
  | "neutral";

function StatCard({
  label,
  value,
  description,
  accent = "neutral",
  to,
}: {
  label: string;
  value: number | string;
  description?: string;
  accent?: Accent;
  to?: string;
}) {
  const accentClasses: Record<
    Accent,
    string
  > = {
    brand: "text-brand-strong",
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-danger",
    neutral: "text-ink",
  };

  const content = (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-line
        bg-surface
        p-5
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-brand/30
        hover:shadow-md
      "
    >
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-brand-soft opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          {label}
        </div>

        <div
          className={`mt-2 text-3xl font-semibold tracking-tight ${accentClasses[accent]}`}
        >
          {value}
        </div>

        {description && (
          <div className="mt-1 text-xs text-ink-faint">
            {description}
          </div>
        )}
      </div>
    </div>
  );

  if (!to) {
    return content;
  }

  return (
    <Link
      to={to}
      className="block"
    >
      {content}
    </Link>
  );
}

function ProgressBar({
  value,
  total,
  className = "bg-brand",
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (value / total) * 100,
          ),
        )
      : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div
        className={`h-full rounded-full transition-all duration-700 ${className}`}
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
}

function StatusRow({
  label,
  value,
  total,
  dotClass,
}: {
  label: string;
  value: number;
  total: number;
  dotClass: string;
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100,
        )
      : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`}
      />

      <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
        {label}
      </span>

      <span className="font-mono text-sm font-semibold text-ink">
        {value}
      </span>

      <span className="w-10 text-right font-mono text-[10px] text-ink-faint">
        {percentage}%
      </span>
    </div>
  );
}

function RoomStatusCard({
  summary,
}: {
  summary: DashboardSummary;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Помещения
          </div>

          <h2 className="mt-1 text-base font-semibold text-ink">
            Состояние кабинетов
          </h2>
        </div>

        <Link
          to="/rooms"
          className="text-xs font-medium text-brand hover:text-brand-strong"
        >
          Все кабинеты →
        </Link>
      </div>

      <div className="mt-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-line">
          {summary.totalRooms > 0 && (
            <>
              <div
                className="bg-ok transition-all"
                style={{
                  width: `${(summary.roomsOk / summary.totalRooms) * 100}%`,
                }}
              />

              <div
                className="bg-warn transition-all"
                style={{
                  width: `${(summary.roomsWarning / summary.totalRooms) * 100}%`,
                }}
              />

              <div
                className="bg-danger transition-all"
                style={{
                  width: `${(summary.roomsCritical / summary.totalRooms) * 100}%`,
                }}
              />

              <div
                className="bg-neutral transition-all"
                style={{
                  width: `${(summary.roomsEmpty / summary.totalRooms) * 100}%`,
                }}
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <StatusRow
          label="В норме"
          value={summary.roomsOk}
          total={summary.totalRooms}
          dotClass="bg-ok"
        />

        <StatusRow
          label="Требуют внимания"
          value={summary.roomsWarning}
          total={summary.totalRooms}
          dotClass="bg-warn"
        />

        <StatusRow
          label="Критические"
          value={summary.roomsCritical}
          total={summary.totalRooms}
          dotClass="bg-danger"
        />

        <StatusRow
          label="Пустые"
          value={summary.roomsEmpty}
          total={summary.totalRooms}
          dotClass="bg-neutral"
        />
      </div>
    </section>
  );
}

function EquipmentStatusCard({
  summary,
}: {
  summary: DashboardSummary;
}) {
  const total =
    summary.totalEquipment;

  const workingPercent =
    total > 0
      ? Math.round(
          (summary.equipmentInUse /
            total) *
            100,
        )
      : 0;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Инвентарь
          </div>

          <h2 className="mt-1 text-base font-semibold text-ink">
            Состояние оборудования
          </h2>
        </div>

        <Link
          to="/equipment"
          className="text-xs font-medium text-brand hover:text-brand-strong"
        >
          Всё оборудование →
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-line">
          <div
            className="absolute inset-[-10px] rounded-full border-[10px] border-transparent border-t-ok border-r-ok"
            style={{
              transform: `rotate(${workingPercent * 1.8 - 45}deg)`,
            }}
          />

          <div className="text-center">
            <div className="font-mono text-2xl font-semibold text-ink">
              {workingPercent}%
            </div>

            <div className="text-[9px] uppercase tracking-wide text-ink-faint">
              в работе
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <StatusRow
            label="В эксплуатации"
            value={
              summary.equipmentInUse
            }
            total={total}
            dotClass="bg-ok"
          />

          <StatusRow
            label="В ремонте"
            value={
              summary.equipmentRepair
            }
            total={total}
            dotClass="bg-warn"
          />

          <StatusRow
            label="На складе"
            value={
              summary.equipmentStorage
            }
            total={total}
            dotClass="bg-neutral"
          />

          <StatusRow
            label="Списано"
            value={
              summary.equipmentWrittenOff
            }
            total={total}
            dotClass="bg-danger"
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-ink-faint">
            Рабочее состояние
          </span>

          <span className="font-mono text-xs font-semibold text-ok">
            {workingPercent}%
          </span>
        </div>

        <ProgressBar
          value={
            summary.equipmentInUse
          }
          total={total}
          className="bg-ok"
        />
      </div>
    </section>
  );
}

function AttentionCard({
  summary,
}: {
  summary: DashboardSummary;
}) {
  const attentionItems = [
    {
      value: summary.roomsCritical,
      label: "Кабинетов требуют срочной проверки",
      href: "/rooms",
      tone:
        summary.roomsCritical > 0
          ? "danger"
          : "ok",
    },
    {
      value: summary.equipmentRepair,
      label: "единиц оборудования находятся в ремонте",
      href: "/equipment",
      tone:
        summary.equipmentRepair > 0
          ? "warn"
          : "ok",
    },
    {
      value:
        summary.openWorkLogs +
        summary.inProgressWorkLogs,
      label: "активных рабочих отчётов",
      href: "/reports",
      tone:
        summary.openWorkLogs +
          summary.inProgressWorkLogs >
        0
          ? "warn"
          : "ok",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Контроль
            </div>

            <h2 className="mt-1 text-base font-semibold text-ink">
              Требует внимания
            </h2>
          </div>
        </div>
      </div>

      <div className="divide-y divide-line">
        {attentionItems.map(
          (item, index) => {
            const hasProblem =
              item.value > 0;

            return (
              <Link
                key={index}
                to={item.href}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-soft/50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                    item.tone ===
                    "danger"
                      ? "bg-danger-soft text-danger"
                      : item.tone ===
                        "warn"
                      ? "bg-warn-soft text-warn"
                      : "bg-ok-soft text-ok"
                  }`}
                >
                  {hasProblem
                    ? "!"
                    : "✓"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink-soft">
                    <strong className="font-semibold text-ink">
                      {item.value}
                    </strong>{" "}
                    {item.label}
                  </div>
                </div>

                <span className="text-lg text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand">
                  →
                </span>
              </Link>
            );
          },
        )}
      </div>
    </section>
  );
}

function FloorsCard({
  floors,
}: {
  floors: FloorResponse[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Здание
          </div>

          <h2 className="mt-1 text-base font-semibold text-ink">
            Этажи
          </h2>
        </div>

        <Link
          to="/floors"
          className="text-xs font-medium text-brand hover:text-brand-strong"
        >
          Все этажи →
        </Link>
      </div>

      {floors.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {floors.map((floor) => (
            <Link
              key={floor.id}
              to="/floors"
              className="
                group
                rounded-xl
                border
                border-line
                bg-canvas
                p-4
                transition-all
                hover:-translate-y-0.5
                hover:border-brand/40
                hover:bg-brand-soft
              "
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ink-faint group-hover:text-brand">
                  Этаж
                </span>

                <span className="font-mono text-sm font-semibold text-brand-strong">
                  {floor.number}
                </span>
              </div>

              <div className="mt-3 truncate text-sm font-medium text-ink">
                {floor.name ||
                  `Этаж ${floor.number}`}
              </div>

              <div className="mt-2 text-xs text-ink-faint">
                {floor.roomsCount}{" "}
                {getRoomWord(
                  floor.roomsCount,
                )}
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand transition-all group-hover:bg-brand-strong"
                  style={{
                    width:
                      floor.roomsCount >
                      0
                        ? "100%"
                        : "0%",
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-line px-5 py-10 text-center text-sm text-ink-faint">
          Этажей пока нет
        </div>
      )}
    </section>
  );
}

function QuickActions() {
  const actions = [
    {
      href: "/equipment",
      tag: "EQ",
      title: "Оборудование",
      description:
        "Инвентарный учёт",
    },
    {
      href: "/rooms",
      tag: "RM",
      title: "Кабинеты",
      description:
        "Помещения и техника",
    },
    {
      href: "/employees",
      tag: "EMP",
      title: "Сотрудники",
      description:
        "Ответственные лица",
    },
    {
      href: "/reports",
      tag: "RPT",
      title: "Отчёты",
      description:
        "История работ",
    },
  ];

  return (
    <section>
      <div className="mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Навигация
        </div>

        <h2 className="mt-1 text-base font-semibold text-ink">
          Быстрый доступ
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map(
          (action) => (
            <Link
              key={action.href}
              to={action.href}
              className="
                group
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-line
                bg-surface
                p-4
                shadow-sm
                transition-all
                hover:-translate-y-0.5
                hover:border-brand/30
                hover:bg-brand-soft
                hover:shadow-md
              "
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas font-mono text-[10px] font-semibold text-ink-faint transition-colors group-hover:border-brand/30 group-hover:text-brand">
                {action.tag}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand-strong">
                  {action.title}
                </span>

                <span className="mt-0.5 block truncate text-xs text-ink-faint">
                  {action.description}
                </span>
              </span>

              <span className="ml-auto text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand">
                →
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}

function getRoomWord(
  count: number,
) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return "кабинет";
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 10 ||
      mod100 >= 20)
  ) {
    return "кабинета";
  }

  return "кабинетов";
}

export function DashboardPage() {
  const { user } = useAuth();

  const [summary, setSummary] =
    useState<DashboardSummary | null>(
      null,
    );

  const [floors, setFloors] =
    useState<FloorResponse[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadDashboard() {
    setIsLoading(true);
    setError(null);

    try {
      const [
        { data: summaryData },
        floorsData,
      ] = await Promise.all([
        apiClient.get<DashboardSummary>(
          "/dashboard/summary",
        ),
        fetchFloors(),
      ]);

      setSummary(summaryData);
      setFloors(floorsData);
    } catch {
      setError(
        "Не удалось загрузить сводку. Попробуйте обновить страницу.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const firstName =
    user?.fullName
      ?.trim()
      .split(" ")[0] ||
    "коллега";

  const activeReports =
    summary
      ? summary.openWorkLogs +
        summary.inProgressWorkLogs
      : 0;

  const attentionCount =
    summary
      ? summary.roomsCritical +
        summary.equipmentRepair +
        activeReports
      : 0;

  return (
    <AppShell title="Дашборд">
      <div className="space-y-6">
        {/* ================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
              GrorioTech Inventory
            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Добро пожаловать,{" "}
              {firstName}
            </h1>

            <p className="mt-1 text-sm text-ink-soft">
              Общая информация по
              инфраструктуре и
              инвентарю института.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {attentionCount > 0 && (
              <div className="rounded-full border border-warn/30 bg-warn-soft px-3 py-1.5 text-xs font-medium text-warn">
                {attentionCount}{" "}
                {attentionCount === 1
                  ? "пункт"
                  : "пункта"}{" "}
                требуют внимания
              </div>
            )}

            <button
              type="button"
              onClick={loadDashboard}
              disabled={isLoading}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "Обновление…"
                : "Обновить"}
            </button>
          </div>
        </div>

        {/* ================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-danger">
              {error}
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="self-start rounded-lg border border-danger/20 bg-surface px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 sm:self-auto"
            >
              Повторить
            </button>
          </div>
        )}

        {/* ================================================
            LOADING
        ================================================= */}

        {isLoading && !summary && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-line bg-surface"
              />
            ))}
          </div>
        )}

        {summary && (
          <>
            {/* ============================================
                KPI
            ============================================= */}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Этажей"
                value={
                  summary.totalFloors
                }
                description="в здании"
                to="/floors"
              />

              <StatCard
                label="Кабинетов"
                value={
                  summary.totalRooms
                }
                description={`${summary.roomsOk} в норме · ${summary.roomsWarning} требуют внимания`}
                accent={
                  summary.roomsCritical >
                  0
                    ? "danger"
                    : summary.roomsWarning >
                        0
                      ? "warn"
                      : "ok"
                }
                to="/rooms"
              />

              <StatCard
                label="Оборудования"
                value={
                  summary.totalEquipment
                }
                description={`${summary.equipmentInUse} в эксплуатации · ${summary.equipmentRepair} в ремонте`}
                accent="brand"
                to="/equipment"
              />

              <StatCard
                label="Рабочих отчётов"
                value={
                  activeReports
                }
                description={`${summary.openWorkLogs} открыто · ${summary.inProgressWorkLogs} в работе`}
                accent={
                  activeReports > 0
                    ? "warn"
                    : "ok"
                }
                to="/reports"
              />
            </div>

            {/* ============================================
                ATTENTION
            ============================================= */}

            <AttentionCard
              summary={summary}
            />

            {/* ============================================
                ROOMS + EQUIPMENT
            ============================================= */}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RoomStatusCard
                summary={summary}
              />

              <EquipmentStatusCard
                summary={summary}
              />
            </div>

            {/* ============================================
                FLOORS
            ============================================= */}

            <FloorsCard
              floors={floors}
            />

            {/* ============================================
                QUICK ACCESS
            ============================================= */}

            <QuickActions />
          </>
        )}
      </div>
    </AppShell>
  );
}