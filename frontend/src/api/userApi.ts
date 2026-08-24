import { apiClient } from "./client";
import type { PageResponse } from "../types/page";
import type { UserRequest, UserResponse } from "../types/user";

// Весь UserController закрыт @PreAuthorize("hasRole('ADMIN')") на бэкенде —
// вызывающий код должен сам проверять роль перед вызовом, иначе получит 403.

// Для выпадающих списков (исполнитель/заявитель в заявках) — без пагинации.
export async function fetchAllUsers(): Promise<UserResponse[]> {
  const { data } = await apiClient.get<PageResponse<UserResponse>>("/users", {
    params: { size: 500, sort: "fullName" },
  });
  return data.content;
}

export async function fetchUsersPage(page: number, size = 20): Promise<PageResponse<UserResponse>> {
  const { data } = await apiClient.get<PageResponse<UserResponse>>("/users", {
    params: { page, size },
  });
  return data;
}

export async function createUser(payload: UserRequest): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>("/users", payload);
  return data;
}

export async function updateUser(id: number, payload: UserRequest): Promise<UserResponse> {
  const { data } = await apiClient.put<UserResponse>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
