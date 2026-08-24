import { apiClient } from "./client";
import type {
  PlanMarkerRequest,
  PlanMarkerResponse,
  PlanMarkerTypeRequest,
  PlanMarkerTypeResponse,
} from "../types/floorPlan";

export async function fetchMarkerTypes(): Promise<PlanMarkerTypeResponse[]> {
  const { data } = await apiClient.get<PlanMarkerTypeResponse[]>("/marker-types");
  return data;
}

export async function createMarkerType(payload: PlanMarkerTypeRequest): Promise<PlanMarkerTypeResponse> {
  const { data } = await apiClient.post<PlanMarkerTypeResponse>("/marker-types", payload);
  return data;
}

export async function updateMarkerType(
  id: number,
  payload: PlanMarkerTypeRequest,
): Promise<PlanMarkerTypeResponse> {
  const { data } = await apiClient.put<PlanMarkerTypeResponse>(`/marker-types/${id}`, payload);
  return data;
}

export async function deleteMarkerType(id: number): Promise<void> {
  await apiClient.delete(`/marker-types/${id}`);
}

export async function fetchMarkers(floorId: number): Promise<PlanMarkerResponse[]> {
  const { data } = await apiClient.get<PlanMarkerResponse[]>(`/floors/${floorId}/markers`);
  return data;
}

export async function createMarker(
  floorId: number,
  payload: PlanMarkerRequest,
): Promise<PlanMarkerResponse> {
  const { data } = await apiClient.post<PlanMarkerResponse>(`/floors/${floorId}/markers`, payload);
  return data;
}

export async function updateMarker(id: number, payload: PlanMarkerRequest): Promise<PlanMarkerResponse> {
  const { data } = await apiClient.put<PlanMarkerResponse>(`/markers/${id}`, payload);
  return data;
}

export async function deleteMarker(id: number): Promise<void> {
  await apiClient.delete(`/markers/${id}`);
}