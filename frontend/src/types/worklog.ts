// Соответствует enums/WorkType.java, WorkStatus.java,
// dto/worklog/WorkLogResponse.java и WorkLogRequest.java
export type WorkType =
  | "REPAIR"
  | "COMPONENT_REPLACE"
  | "CLEANING"
  | "OS_REINSTALL"
  | "MOVE"
  | "INVENTORY"
  | "WARRANTY"
  | "OTHER";

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  REPAIR: "Ремонт",
  COMPONENT_REPLACE: "Замена комплектующих",
  CLEANING: "Чистка",
  OS_REINSTALL: "Переустановка ОС",
  MOVE: "Перемещение",
  INVENTORY: "Инвентаризация",
  WARRANTY: "Гарантийное обслуживание",
  OTHER: "Другое",
};

export type WorkStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыта",
};

export interface WorkLogResponse {
  id: number;
  equipmentId: number | null;
  equipmentInventoryNumber: string | null;
  workType: WorkType;
  description: string | null;
  status: WorkStatus;
  executorId: number | null;
  executorName: string | null;
  requestedById: number | null;
  startedAt: string | null; // ISO datetime
  finishedAt: string | null;
  timeSpentMinutes: number | null;
  usedParts: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLogRequest {
  equipmentId: number;
  workType: WorkType;
  description: string | null;
  status: WorkStatus | null;
  executorId: number | null;
  requestedById: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  timeSpentMinutes: number | null;
  usedParts: string | null;
}
