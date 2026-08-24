import axios, { AxiosError } from "axios";

export const TOKEN_STORAGE_KEY = "gti_token";

// В dev-режиме запросы идут через прокси Vite (см. vite.config.ts) на
// http://localhost:8080, поэтому базовый путь — просто "/api".
// В проде можно переопределить через переменную окружения VITE_API_BASE_URL.
const baseURL = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api`;

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Единая точка обработки истёкшего/недействительного токена —
// сбрасываем сессию и уводим на экран логина.
let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

// Единый формат ошибки, который присылает GlobalExceptionHandler
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  fields?: Record<string, string>;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error) return body.error;
  }
  return fallback;
}
