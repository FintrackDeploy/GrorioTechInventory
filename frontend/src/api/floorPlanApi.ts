import { apiClient } from "./client";
import type { FloorPlanResponse } from "../types/floorPlan";

export async function fetchFloorPlan(floorId: number): Promise<FloorPlanResponse> {
  const { data } = await apiClient.get<FloorPlanResponse>(`/floors/${floorId}/plan`);
  return data;
}

export async function uploadFloorPlan(floorId: number, file: File): Promise<FloorPlanResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<FloorPlanResponse>(
    `/floors/${floorId}/plan`,
    formData,
    // Убираем дефолтный application/json, чтобы axios/браузер сам
    // проставил multipart/form-data с корректным boundary.
    { headers: { "Content-Type": undefined } },
  );
  return data;
}