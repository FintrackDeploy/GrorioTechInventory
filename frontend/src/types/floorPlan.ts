// Соответствует dto/floorplan/FloorPlanResponse.java и dto/planmarker/*.java
export interface FloorPlanResponse {
  id: number;
  floorId: number;
  floorNumber: number;
  imageUrl: string | null;
  originalWidth: number;
  originalHeight: number;
  updatedAt: string;
}

export type MarkerKind = "POINT" | "LINE";

export interface PlanMarkerTypeResponse {
  id: number;
  name: string;
  color: string; // hex, например "#ef4444"
  kind: MarkerKind;
}

export interface PlanMarkerTypeRequest {
  name: string;
  color: string;
  kind: MarkerKind;
}

export interface PlanMarkerResponse {
  id: number;
  floorId: number;
  markerTypeId: number;
  markerTypeName: string;
  markerTypeColor: string;
  kind: MarkerKind;
  // "x,y" для точки, "x1,y1 x2,y2 ..." для линии — те же пиксельные
  // координаты исходного изображения плана
  points: string;
  label: string | null;
}

export interface PlanMarkerRequest {
  markerTypeId: number;
  points: string;
  label: string | null;
}