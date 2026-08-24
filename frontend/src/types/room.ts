export type RoomType = "CLASSROOM" | "LAB" | "OFFICE" | "SERVER" | "STORAGE";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  CLASSROOM: "Аудитория",
  LAB: "Лаборатория",
  OFFICE: "Кабинет",
  SERVER: "Серверная",
  STORAGE: "Склад",
};

export type MapStatus = "OK" | "WARNING" | "CRITICAL" | "EMPTY";

export interface RoomEmployeeRef {
  id: number;
  fullName: string;
  position: string | null;
}

export interface RoomResponse {
  id: number;
  floorId: number | null;
  floorNumber: number | null;
  number: string;
  name: string | null;
  roomType: RoomType;
  employees: RoomEmployeeRef[];
  equipmentCount: number;
  inRepair: number;
  inStorage: number;
  mapStatus: MapStatus;
}

export interface RoomRequest {
  floorId: number;
  number: string;
  name: string | null;
  roomType: RoomType;
  employeeIds: number[];
}