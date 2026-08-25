import { apiClient } from "./client";
import type { PageResponse } from "../types/page";
import type { DepartmentSummary, EmployeeRequest, EmployeeResponse } from "../types/employee";

// Для выпадающих списков (ответственный сотрудник) забираем всех активных
// одной страницей — сотрудников в институте обычно не тысячи.
export async function fetchAllActiveEmployees(): Promise<EmployeeResponse[]> {
  const { data } = await apiClient.get<PageResponse<EmployeeResponse>>("/employees", {
    params: { onlyActive: true, size: 500, sort: "fullName" },
  });
  return data.content;
}

export async function fetchEmployeesPage(
  onlyActive: boolean,
  department: string | null,
  page: number,
  size = 20,
): Promise<PageResponse<EmployeeResponse>> {
  const { data } = await apiClient.get<PageResponse<EmployeeResponse>>("/employees", {
    params: { onlyActive, department: department || undefined, page, size, sort: "fullName" },
  });
  return data;
}

// Сводка по отделам — для сайдбара-фильтра на странице сотрудников.
export async function fetchDepartments(): Promise<DepartmentSummary[]> {
  const { data } = await apiClient.get<DepartmentSummary[]>("/employees/departments");
  return data;
}

export async function createEmployee(payload: EmployeeRequest): Promise<EmployeeResponse> {
  const { data } = await apiClient.post<EmployeeResponse>("/employees", payload);
  return data;
}

export async function updateEmployee(
  id: number,
  payload: EmployeeRequest,
): Promise<EmployeeResponse> {
  const { data } = await apiClient.put<EmployeeResponse>(`/employees/${id}`, payload);
  return data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiClient.delete(`/employees/${id}`);
}