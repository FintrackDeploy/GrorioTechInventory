import type { Role } from "../../types/auth";

export interface NavItem {
  to: string;
  label: string;
  tag: string;
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Дашборд", tag: "DSH" },
  { to: "/floors", label: "Этажи и планы", tag: "FLR" },
  { to: "/rooms", label: "Кабинеты", tag: "RM" },
  { to: "/equipment", label: "Оборудование", tag: "EQ" },
  { to: "/reports", label: "Отчёты о работах", tag: "RPT" },
  { to: "/employees", label: "Сотрудники", tag: "EMP" },
  { to: "/users", label: "Пользователи", tag: "USR", roles: ["ADMIN"] },
];