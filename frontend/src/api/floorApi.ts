import { apiClient } from "./client";
import type { FloorRequest, FloorResponse } from "../types/floor";

export async function fetchFloors(): Promise<FloorResponse[]> {
  const { data } = await apiClient.get<FloorResponse[]>("/floors");
  return data;
}

export async function createFloor(payload: FloorRequest): Promise<FloorResponse> {
  const { data } = await apiClient.post<FloorResponse>("/floors", payload);
  return data;
}

export async function updateFloor(id: number, payload: FloorRequest): Promise<FloorResponse> {
  const { data } = await apiClient.put<FloorResponse>(`/floors/${id}`, payload);
  return data;
}

export async function deleteFloor(id: number): Promise<void> {
  await apiClient.delete(`/floors/${id}`);
}
