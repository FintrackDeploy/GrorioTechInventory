// Соответствует enums/Role.java и dto/auth/*.java на бэкенде
export type Role = "ADMIN" | "ENGINEER" | "STAFF";

export interface LoginRequest {
  username: string;
  password: string;
}

// Соответствует dto/auth/LoginResponse.java
export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface AuthUser {
  username: string;
  fullName: string;
  role: Role;
}
