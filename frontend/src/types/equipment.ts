export type EquipmentType =
  | "COMPUTER"
  | "LAPTOP"
  | "THIN_CLIENT"
  | "MONITOR"
  | "KEYBOARD"
  | "MOUSE"
  | "PRINTER"
  | "MFP"
  | "SCANNER"
  | "SWITCH"
  | "ROUTER"
  | "ACCESS_POINT"
  | "PROJECTOR"
  | "UPS"
  | "SERVER"
  | "PHONE"
  | "TABLET"
  | "OTHER";

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  COMPUTER: "Компьютер",
  LAPTOP: "Ноутбук",
  THIN_CLIENT: "Тонкий клиент",
  MONITOR: "Монитор",
  KEYBOARD: "Клавиатура",
  MOUSE: "Мышь",
  PRINTER: "Принтер",
  MFP: "МФУ",
  SCANNER: "Сканер",
  SWITCH: "Коммутатор",
  ROUTER: "Роутер",
  ACCESS_POINT: "Точка доступа",
  PROJECTOR: "Проектор",
  UPS: "ИБП",
  SERVER: "Сервер",
  PHONE: "Телефон",
  TABLET: "Планшет",
  OTHER: "Другое",
};

// Группы для отображения в форме
export const EQUIPMENT_TYPE_GROUPS: { label: string; types: EquipmentType[] }[] = [
  {
    label: "Вычислительная техника",
    types: ["COMPUTER", "LAPTOP", "THIN_CLIENT", "SERVER"],
  },
  {
    label: "Периферия",
    types: ["MONITOR", "KEYBOARD", "MOUSE", "PROJECTOR"],
  },
  {
    label: "Печать",
    types: ["PRINTER", "MFP", "SCANNER"],
  },
  {
    label: "Сеть",
    types: ["SWITCH", "ROUTER", "ACCESS_POINT"],
  },
  {
    label: "Прочее",
    types: ["UPS", "PHONE", "TABLET", "OTHER"],
  },
];

// Типы, у которых показываем IP/MAC
export const NETWORK_TYPES: EquipmentType[] = [
  "COMPUTER",
  "LAPTOP",
  "THIN_CLIENT",
  "SERVER",
  "SWITCH",
  "ROUTER",
  "ACCESS_POINT",
];

// Типы, у которых показываем поля ПК
export const COMPUTER_TYPES: EquipmentType[] = [
  "COMPUTER",
  "LAPTOP",
  "THIN_CLIENT",
  "SERVER",
];

export type EquipmentStatus = "IN_USE" | "REPAIR" | "STORAGE" | "WRITTEN_OFF";

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  IN_USE: "В эксплуатации",
  REPAIR: "В ремонте",
  STORAGE: "На складе",
  WRITTEN_OFF: "Списано",
};

export interface EquipmentResponse {
  id: number;
  inventoryNumber: string;
  type: EquipmentType;
  status: EquipmentStatus;
  roomId: number | null;
  roomNumber: string | null;
  responsibleEmployeeId: number | null;
  responsibleEmployeeName: string | null;
  purchaseDate: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  notes: string | null;
  // ПК
  cpu: string | null;
  ramGb: number | null;
  storage: string | null;
  gpu: string | null;
  os: string | null;
  formFactor: string | null;
  // Монитор / Проектор
  diagonalInch: number | null;
  resolution: string | null;
  panelType: string | null;
  connectors: string | null;
  // Принтер / МФУ
  printSpeedPpm: number | null;
  printColor: boolean | null;
  printFormat: string | null;
  // Мышь / Клавиатура
  wireless: boolean | null;
  // Клавиатура
  switchType: string | null;
  // Сеть / ИБП
  portCount: number | null;
  powerVa: number | null;
  batteryRuntimeMin: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentRequest {
  inventoryNumber: string;
  type: EquipmentType;
  status: EquipmentStatus;
  roomId: number | null;
  responsibleEmployeeId: number | null;
  purchaseDate: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  notes: string | null;
  cpu: string | null;
  ramGb: number | null;
  storage: string | null;
  gpu: string | null;
  os: string | null;
  formFactor: string | null;
  diagonalInch: number | null;
  resolution: string | null;
  panelType: string | null;
  connectors: string | null;
  printSpeedPpm: number | null;
  printColor: boolean | null;
  printFormat: string | null;
  wireless: boolean | null;
  switchType: string | null;
  portCount: number | null;
  powerVa: number | null;
  batteryRuntimeMin: number | null;
}