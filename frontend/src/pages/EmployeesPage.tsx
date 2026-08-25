import { useEffect, useState } from "react";
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
import type { DepartmentSummary, EmployeeRequest, EmployeeResponse } from "../types/employee";
import type { PageResponse } from "../types/page";

const PAGE_SIZE = 20;

export function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const [onlyActive, setOnlyActive] = useState(true);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<EmployeeResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingEmployee, setEditingEmployee] = useState<EmployeeResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function loadDepartments() {
    try {
      const result = await fetchDepartments();
      setDepartments(result);
    } catch {
      setDepartments([]);
    }
  }

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchEmployeesPage(onlyActive, selectedDepartment, page, PAGE_SIZE);
      setData(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Не удалось загрузить сотрудников"));
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
  }, [onlyActive, selectedDepartment, page]);

  function handleSelectDepartment(department: string | null) {
    setPage(0);
    setSelectedDepartment(department);
  }

  async function handleCreate(payload: EmployeeRequest) {
    await createEmployee(payload);
    setPage(0);
    await Promise.all([load(), loadDepartments()]);
  }

  async function handleUpdate(payload: EmployeeRequest) {
    if (!editingEmployee) return;
    await updateEmployee(editingEmployee.id, payload);
    await Promise.all([load(), loadDepartments()]);
  }

  async function handleDelete(employee: EmployeeResponse) {
    if (!window.confirm(`Удалить сотрудника ${employee.fullName}?`)) return;
    try {
      await deleteEmployee(employee.id);
      await Promise.all([load(), loadDepartments()]);
    } catch (err) {
      window.alert(extractApiErrorMessage(err, "Не удалось удалить сотрудника"));
    }
  }

  const totalActiveOrAll = departments.reduce((sum, d) => sum + d.employeesCount, 0);

  return (
    <AppShell title="Сотрудники">
      <div className="flex gap-4">
        <DepartmentSidebar
          departments={departments}
          selectedDepartment={selectedDepartment}
          onSelect={handleSelectDepartment}
          totalCount={totalActiveOrAll}
        />

        <div className="flex-1 rounded-lg border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-3">
              {selectedDepartment && (
                <span className="tag-mono rounded border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] text-brand-strong">
                  Отдел: {selectedDepartment}
                </span>
              )}
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => {
                    setPage(0);
                    setOnlyActive(e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                />
                Только активные
              </label>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
              >
                + Сотрудник
              </button>
            )}
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
                  <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">ФИО</th>
                  <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Должность</th>
                  <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Отдел</th>
                  <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Телефон</th>
                  <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Email</th>
                  <th className="tag-mono px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide">Статус</th>
                  {isAdmin && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-ink-faint">
                      Загрузка…
                    </td>
                  </tr>
                )}
                {!isLoading && data?.content.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-ink-faint">
                      {selectedDepartment
                        ? `В отделе «${selectedDepartment}» сотрудников не найдено`
                        : "Сотрудников не найдено"}
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  data?.content.map((emp) => (
                    <tr key={emp.id} className="border-b border-line last:border-0 hover:bg-neutral-soft/50">
                      <td className="px-4 py-2.5 text-ink">{emp.fullName}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{emp.position || "—"}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{emp.department || "—"}</td>
                      <td className="tag-mono px-4 py-2.5 text-ink-soft">{emp.internalPhone || "—"}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{emp.email || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`tag-mono inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                            emp.isActive
                              ? "border-ok/30 bg-ok-soft text-ok"
                              : "border-neutral/30 bg-neutral-soft text-neutral"
                          }`}
                        >
                          {emp.isActive ? "Активен" : "Неактивен"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setEditingEmployee(emp)}
                            className="mr-3 text-xs text-ink-faint hover:text-brand"
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(emp)}
                            className="text-xs text-ink-faint hover:text-danger"
                          >
                            Удалить
                          </button>
                        </td>
                      )}
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
      </div>

      {isCreating && (
        <EmployeeFormModal
          employee={null}
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingEmployee && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSubmit={handleUpdate}
        />
      )}
    </AppShell>
  );
}