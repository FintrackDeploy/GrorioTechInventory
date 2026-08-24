// Соответствует dto/user/UserResponse.java и UserRequest.java
import type { Role } from "./auth";

export interface UserResponse {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: Role;
  isActive: boolean | null;
  createdAt: string;
}

export interface UserRequest {
  username: string;
  // Обязателен при создании (UserService.create кидает ошибку, если пусто);
  // при редактировании пустое значение = "не менять пароль".
  password: string | null;
  fullName: string;
  email: string | null;
  role: Role;
  isActive: boolean | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Администратор",
  ENGINEER: "Инженер",
  STAFF: "Сотрудник",
};
