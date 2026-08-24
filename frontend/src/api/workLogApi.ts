import { apiClient } from "./client";
import type { PageResponse } from "../types/page";
import type { WorkLogRequest, WorkLogResponse, WorkStatus } from "../types/worklog";

export interface WorkLogFilters {
  equipmentId?: number | null;
  status?: WorkStatus | null;
}

export async function fetchWorkLogsPage(
  filters: WorkLogFilters,
  page: number,
  size = 20,
): Promise<PageResponse<WorkLogResponse>> {
  const { data } = await apiClient.get<PageResponse<WorkLogResponse>>("/work-logs", {
    params: {
      equipmentId: filters.equipmentId || undefined,
      status: filters.status || undefined,
      page,
      size,
    },
  });
  return data;
}

export async function createWorkLog(payload: WorkLogRequest): Promise<WorkLogResponse> {
  const { data } = await apiClient.post<WorkLogResponse>("/work-logs", payload);
  return data;
}

export async function updateWorkLog(id: number, payload: WorkLogRequest): Promise<WorkLogResponse> {
  const { data } = await apiClient.put<WorkLogResponse>(`/work-logs/${id}`, payload);
  return data;
}

export async function updateWorkLogStatus(
  id: number,
  status: WorkStatus,
): Promise<WorkLogResponse> {
  const { data } = await apiClient.patch<WorkLogResponse>(`/work-logs/${id}/status`, null, {
    params: { status },
  });
  return data;
}

export async function deleteWorkLog(id: number): Promise<void> {
  await apiClient.delete(`/work-logs/${id}`);
}
