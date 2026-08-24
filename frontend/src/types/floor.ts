// Соответствует dto/floor/FloorResponse.java и FloorRequest.java
export interface FloorResponse {
  id: number;
  number: number;
  name: string | null;
  roomsCount: number;
}

export interface FloorRequest {
  number: number;
  name: string | null;
}
