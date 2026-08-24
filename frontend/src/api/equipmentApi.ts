import { apiClient } from "./client";
import type { PageResponse } from "../types/page";
import type { EquipmentRequest, EquipmentResponse, EquipmentStatus, EquipmentType } from "../types/equipment";

export interface EquipmentFilters {
  status?: EquipmentStatus | null;
  type?: EquipmentType | null;
  roomId?: number | null;
  employeeId?: number | null;
  q?: string | null;
}

export async function fetchEquipmentPage(
  filters: EquipmentFilters,
  page: number,
  size = 20,
): Promise<PageResponse<EquipmentResponse>> {
  const { data } = await apiClient.get<PageResponse<EquipmentResponse>>("/equipment", {
    params: {
      status: filters.status || undefined,
      type: filters.type || undefined,
      roomId: filters.roomId || undefined,
      employeeId: filters.employeeId || undefined,
      q: filters.q || undefined,
      page,
      size,
    },
  });
  return data;
}

// Для тайпхеда выбора оборудования в форме заявки — короткий список по
// свободному тексту, без пагинации (см. EquipmentController.search).
export async function searchEquipment(q: string): Promise<EquipmentResponse[]> {
  if (!q.trim()) return [];
  const { data } = await apiClient.get<EquipmentResponse[]>("/equipment/search", {
    params: { q: q.trim() },
  });
  return data;
}

export async function createEquipment(payload: EquipmentRequest): Promise<EquipmentResponse> {
  const { data } = await apiClient.post<EquipmentResponse>("/equipment", payload);
  return data;
}

export async function updateEquipment(
  id: number,
  payload: EquipmentRequest,
): Promise<EquipmentResponse> {
  const { data } = await apiClient.put<EquipmentResponse>(`/equipment/${id}`, payload);
  return data;
}

export async function updateEquipmentStatus(
  id: number,
  status: EquipmentStatus,
): Promise<EquipmentResponse> {
  const { data } = await apiClient.patch<EquipmentResponse>(`/equipment/${id}/status`, null, {
    params: { status },
  });
  return data;
}

export async function deleteEquipment(id: number): Promise<void> {
  await apiClient.delete(`/equipment/${id}`);
}
