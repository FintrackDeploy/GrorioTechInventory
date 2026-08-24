import { apiClient } from "./client";
import type { PageResponse } from "../types/page";
import type { RoomRequest, RoomResponse } from "../types/room";

// Берём все кабинеты этажа одной страницей — на этаж их обычно немного.
// Используется картой этажа (FloorMapView) для списка "кабинеты без полигона".
export async function fetchRoomsByFloor(floorId: number): Promise<RoomResponse[]> {
  const { data } = await apiClient.get<PageResponse<RoomResponse>>("/rooms", {
    params: { floorId, size: 200, sort: "number" },
  });
  return data.content;
}

// Для выпадающих списков (фильтры/форма оборудования) — все кабинеты одной
// страницей, без привязки к этажу.
export async function fetchAllRooms(): Promise<RoomResponse[]> {
  const { data } = await apiClient.get<PageResponse<RoomResponse>>("/rooms", {
    params: { size: 1000, sort: "number" },
  });
  return data.content;
}

export async function fetchRoomsPage(
  floorId: number | null,
  page: number,
  size = 20,
): Promise<PageResponse<RoomResponse>> {
  const { data } = await apiClient.get<PageResponse<RoomResponse>>("/rooms", {
    params: { floorId: floorId ?? undefined, page, size, sort: "number" },
  });
  return data;
}

export async function createRoom(payload: RoomRequest): Promise<RoomResponse> {
  const { data } = await apiClient.post<RoomResponse>("/rooms", payload);
  return data;
}

export async function updateRoom(id: number, payload: RoomRequest): Promise<RoomResponse> {
  const { data } = await apiClient.put<RoomResponse>(`/rooms/${id}`, payload);
  return data;
}

export async function deleteRoom(id: number): Promise<void> {
  await apiClient.delete(`/rooms/${id}`);
}
