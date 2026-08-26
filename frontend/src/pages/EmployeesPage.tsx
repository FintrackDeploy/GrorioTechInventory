import { useEffect, useMemo, useState } from "react";

import { AppShell } from "../components/layout/AppShell";
import { Pagination } from "../components/shared/Pagination";
import { EmployeeFormModal } from "../components/employees/EmployeeFormModal";
import { DepartmentSidebar } from "../components/employees/DepartmentSidebar";

import { useAuth } from "../context/AuthContext";

import {
  createEmployee,
  deleteEmployee,
  fetchDepartments,
  fetchEmployeesPage,
  updateEmployee,
} from "../api/employeeApi";

import { extractApiErrorMessage } from "../api/client";

import type {
  DepartmentSummary,
  EmployeeRequest,
  EmployeeResponse,
} from "../types/employee";

import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;

function getInitials(
  fullName: string,
) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase();
}

function getCountWord(
  count: number,
) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return "сотрудник";
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 10 ||
      mod100 >= 20)
  ) {
    return "сотрудника";
  }

  return "сотрудников";
}

function EmployeeCard({
  employee,
  isAdmin,
  onEdit,
  onDelete,
}: {
  employee: EmployeeResponse;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isActive =
    employee.isActive !== false;

  return (
    <article
      className="
        group
        overflow-hidden
        rounded-2xl
        border
        border-line
        bg-surface
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-brand/30
        hover:shadow-md
      "
    >
      <div className="p-5">
        {/* TOP */}

        <div className="flex items-start gap-4">
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-brand-soft
              font-mono
              text-sm
              font-semibold
              text-brand-strong
            "
          >
            {getInitials(
              employee.fullName,
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink">
                  {employee.fullName}
                </h3>

                <p className="mt-1 truncate text-xs text-ink-soft">
                  {employee.position ||
                    "Должность не указана"}
                </p>
              </div>

              <span
                className={`
                  shrink-0
                  rounded-full
                  border
                  px-2
                  py-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-wide
                  ${
                    isActive
                      ? "border-ok/30 bg-ok-soft text-ok"
                      : "border-line bg-neutral-soft text-ink-faint"
                  }
                `}
              >
                {isActive
                  ? "Активен"
                  : "Неактивен"}
              </span>
            </div>
          </div>
        </div>

        {/* DEPARTMENT */}

        <div className="mt-5 rounded-xl border border-line bg-canvas px-3 py-3">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Отдел
          </div>

          <div className="mt-1 truncate text-sm font-medium text-ink">
            {employee.department ||
              "Отдел не указан"}
          </div>
        </div>

        {/* CONTACTS */}

        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="flex min-w-0 items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              Телефон
            </span>

            <span className="truncate pl-3 font-mono text-xs text-ink-soft">
              {employee.internalPhone ||
                "—"}
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              Email
            </span>

            <span
              className="truncate pl-3 text-xs text-ink-soft"
              title={
                employee.email ||
                undefined
              }
            >
              {employee.email ||
                "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}

      {isAdmin && (
        <div className="flex items-center justify-end gap-4 border-t border-line bg-neutral-soft/30 px-5 py-3">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-ink-faint transition hover:text-brand"
          >
            Изменить
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-medium text-ink-faint transition hover:text-danger"
          >
            Удалить
          </button>
        </div>
      )}
    </article>
  );
}

export function EmployeesPage() {
  const { user } = useAuth();

  const isAdmin =
    user?.role === "ADMIN";

  const [
    departments,
    setDepartments,
  ] = useState<DepartmentSummary[]>(
    [],
  );

  const [
    selectedDepartment,
    setSelectedDepartment,
  ] = useState<string | null>(
    null,
  );

  const [onlyActive, setOnlyActive] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(0);

  const [data, setData] =
    useState<PageResponse<EmployeeResponse> | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    editingEmployee,
    setEditingEmployee,
  ] = useState<EmployeeResponse | null>(
    null,
  );

  const [isCreating, setIsCreating] =
    useState(false);

  async function loadDepartments() {
    try {
      const result =
        await fetchDepartments();

      setDepartments(result);
    } catch {
      setDepartments([]);
    }
  }

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const result =
        await fetchEmployeesPage(
          onlyActive,
          selectedDepartment,
          page,
          PAGE_SIZE,
        );

      setData(result);
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Не удалось загрузить сотрудников",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onlyActive,
    selectedDepartment,
    page,
  ]);

  function handleSelectDepartment(
    department: string | null,
  ) {
    setPage(0);
    setSelectedDepartment(
      department,
    );
  }

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value);
  }

  async function handleCreate(
    payload: EmployeeRequest,
  ) {
    await createEmployee(
      payload,
    );

    setPage(0);

    await Promise.all([
      load(),
      loadDepartments(),
    ]);
  }

  async function handleUpdate(
    payload: EmployeeRequest,
  ) {
    if (!editingEmployee) {
      return;
    }

    await updateEmployee(
      editingEmployee.id,
      payload,
    );

    setEditingEmployee(null);

    await Promise.all([
      load(),
      loadDepartments(),
    ]);
  }

  async function handleDelete(
    employee: EmployeeResponse,
  ) {
    if (
      !window.confirm(
        `Удалить сотрудника ${employee.fullName}?`,
      )
    ) {
      return;
    }

    try {
      await deleteEmployee(
        employee.id,
      );

      await Promise.all([
        load(),
        loadDepartments(),
      ]);
    } catch (err) {
      window.alert(
        extractApiErrorMessage(
          err,
          "Не удалось удалить сотрудника",
        ),
      );
    }
  }

  const employees =
    data?.content ?? [];

  /*
   * Search intentionally works on the
   * currently loaded page.
   *
   * The existing API supports:
   * - active filter
   * - department filter
   * - pagination
   *
   * but does not expose a search parameter.
   */
  const visibleEmployees =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return employees;
      }

      return employees.filter(
        (employee) => {
          const haystack = [
            employee.fullName,
            employee.position,
            employee.department,
            employee.internalPhone,
            employee.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            query,
          );
        },
      );
    },
    [employees, search]);

  const totalCount =
    departments.reduce(
      (sum, department) =>
        sum +
        department.employeesCount,
      0,
    );

  const activeDepartmentCount =
    departments.filter(
      (department) =>
        department.employeesCount >
        0,
    ).length;

  const currentPageCount =
    employees.filter(
      (employee) =>
        employee.isActive !== false,
    ).length;

  const inactiveOnPage =
    employees.length -
    currentPageCount;

  const selectedDepartmentData =
    selectedDepartment
      ? departments.find(
          (department) =>
            department.department ===
            selectedDepartment,
        )
      : null;

  return (
    <AppShell title="Сотрудники">
      <div className="space-y-5">
        {/* ============================================
            HEADER
        ============================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
              Персонал
            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Сотрудники
            </h1>

            <p className="mt-1 text-sm text-ink-soft">
              Сотрудники, отделы и
              контактные данные.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                setIsCreating(true)
              }
              className="
                self-start
                rounded-xl
                bg-brand
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                shadow-sm
                transition
                hover:bg-brand-strong
                lg:self-auto
              "
            >
              + Новый сотрудник
            </button>
          )}
        </div>

        {/* ============================================
            STATS
        ============================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Всего
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ink">
              {totalCount}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              {getCountWord(
                totalCount,
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Активные
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-ok">
              {onlyActive
                ? totalCount
                : currentPageCount}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              отображаются в
              системе
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Отделы
            </div>

            <div className="mt-1 font-mono text-2xl font-semibold text-brand-strong">
              {activeDepartmentCount}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              с сотрудниками
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-surface p-4 shadow-sm ${
              inactiveOnPage > 0
                ? "border-warn/30"
                : "border-line"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Неактивные
            </div>

            <div
              className={`mt-1 font-mono text-2xl font-semibold ${
                inactiveOnPage > 0
                  ? "text-warn"
                  : "text-ok"
              }`}
            >
              {inactiveOnPage}
            </div>

            <div className="mt-1 text-xs text-ink-faint">
              на текущей странице
            </div>
          </div>
        </div>

        {/* ============================================
            MAIN
        ============================================= */}

        <div className="flex flex-col gap-4 xl:flex-row">
          {/* DEPARTMENTS */}

          <div className="w-full shrink-0 xl:w-64">
            <DepartmentSidebar
              departments={
                departments
              }
              selectedDepartment={
                selectedDepartment
              }
              onSelect={
                handleSelectDepartment
              }
              totalCount={
                totalCount
              }
            />
          </div>

          {/* EMPLOYEES */}

          <div className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              {/* TOOLBAR */}

              <div className="border-b border-line p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-ink">
                        {selectedDepartment
                          ? selectedDepartment
                          : "Все сотрудники"}
                      </h2>

                      {selectedDepartmentData && (
                        <span className="rounded-full border border-brand/20 bg-brand-soft px-2 py-1 font-mono text-[10px] font-medium text-brand-strong">
                          {
                            selectedDepartmentData.employeesCount
                          }
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-ink-faint">
                      {data
                        ? `Показано ${visibleEmployees.length} из ${data.totalElements}`
                        : "Загрузка списка…"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {/* SEARCH */}

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                        ⌕
                      </span>

                      <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                          handleSearchChange(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Поиск сотрудника..."
                        className="
                          w-full
                          rounded-xl
                          border
                          border-line
                          bg-canvas
                          py-2.5
                          pl-9
                          pr-3
                          text-sm
                          text-ink
                          outline-none
                          transition
                          placeholder:text-ink-faint
                          focus:border-brand
                          focus:ring-2
                          focus:ring-brand/10
                          sm:w-64
                        "
                      />
                    </div>

                    {/* ACTIVE */}

                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5 text-xs text-ink-soft transition hover:border-brand/30">
                      <input
                        type="checkbox"
                        checked={
                          onlyActive
                        }
                        onChange={(
                          event,
                        ) => {
                          setPage(0);

                          setOnlyActive(
                            event
                              .target
                              .checked,
                          );
                        }}
                        className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                      />

                      Только активные
                    </label>
                  </div>
                </div>

                {/* ACTIVE FILTER */}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {selectedDepartment && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectDepartment(
                          null,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1.5 text-[10px] font-medium text-brand-strong transition hover:border-brand/40"
                    >
                      Отдел:{" "}
                      {
                        selectedDepartment
                      }

                      <span className="text-brand">
                        ×
                      </span>
                    </button>
                  )}

                  {onlyActive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/20 bg-ok-soft px-2.5 py-1.5 text-[10px] font-medium text-ok">
                      <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                      Только активные
                    </span>
                  )}

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-neutral-soft px-2.5 py-1.5 text-[10px] font-medium text-ink-soft transition hover:border-brand/30 hover:text-brand"
                    >
                      Поиск: "
                      {search}"
                      <span>
                        ×
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="m-4 flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-danger">
                    {error}
                  </div>

                  <button
                    type="button"
                    onClick={load}
                    className="self-start rounded-lg border border-danger/20 bg-surface px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/5 sm:self-auto"
                  >
                    Повторить
                  </button>
                </div>
              )}

              {/* CONTENT */}

              <div className="p-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Array.from({
                      length: 6,
                    }).map(
                      (_, index) => (
                        <div
                          key={
                            index
                          }
                          className="h-[320px] animate-pulse rounded-2xl border border-line bg-canvas"
                        />
                      ),
                    )}
                  </div>
                ) : visibleEmployees.length ===
                  0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-canvas px-5 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-soft text-xl text-ink-faint">
                      ◯
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-ink">
                      Сотрудники не
                      найдены
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-faint">
                      {search
                        ? "Попробуйте изменить поисковый запрос."
                        : selectedDepartment
                          ? `В отделе «${selectedDepartment}» нет подходящих сотрудников.`
                          : "По текущим фильтрам сотрудников нет."}
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {search && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearch(
                              "",
                            )
                          }
                          className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-brand/30 hover:text-brand"
                        >
                          Очистить
                          поиск
                        </button>
                      )}

                      {selectedDepartment && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectDepartment(
                              null,
                            )
                          }
                          className="rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-strong"
                        >
                          Все отделы
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {visibleEmployees.map(
                      (employee) => (
                        <EmployeeCard
                          key={
                            employee.id
                          }
                          employee={
                            employee
                          }
                          isAdmin={
                            isAdmin
                          }
                          onEdit={() =>
                            setEditingEmployee(
                              employee,
                            )
                          }
                          onDelete={() =>
                            handleDelete(
                              employee,
                            )
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* PAGINATION */}

              {data && (
                <div className="border-t border-line">
                  <Pagination
                    page={data.number}
                    totalPages={
                      data.totalPages
                    }
                    totalElements={
                      data.totalElements
                    }
                    onPageChange={
                      setPage
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CREATE */}

        {isCreating && (
          <EmployeeFormModal
            employee={null}
            onClose={() =>
              setIsCreating(false)
            }
            onSubmit={
              handleCreate
            }
          />
        )}

        {/* EDIT */}

        {editingEmployee && (
          <EmployeeFormModal
            employee={
              editingEmployee
            }
            onClose={() =>
              setEditingEmployee(null)
            }
            onSubmit={
              handleUpdate
            }
          />
        )}
      </div>
    </AppShell>
  );
}