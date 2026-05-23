import axios, { isAxiosError, type AxiosResponse } from "axios";
import { env } from "@/lib/env";
import { getAcceptLanguageHeader, getApiLanguage } from "@/lib/i18n-language";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiErrorBody } from "./types";

if (!env.apiUrl && import.meta.env.DEV) {
  console.error(
    "[api] No API base URL — set VITE_API_URL in frontend/.env (see .env.example).",
  );
}

export const apiClient = axios.create({
  baseURL: env.apiUrl || undefined,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

const STATUS_FALLBACKS: Record<number, string> = {
  400: "Invalid request",
  401: "Please login again",
  403: "Access denied",
  404: "Requested resource not found",
  409: "Conflict detected",
  422: "Validation failed",
  429: "Too many requests. Please wait before trying again.",
  500: "Something went wrong on our server",
  503: "Service temporarily unavailable",
};

function parseErrorBody(data: unknown): ApiErrorBody | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.message === "string") {
    return data as ApiErrorBody;
  }
  if (typeof o.error === "string") {
    return { success: false, message: o.error, code: typeof o.code === "string" ? o.code : undefined };
  }
  return null;
}

/** Unwrap `{ success, data }` or return legacy payload as-is */
export function unwrapApiData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success: boolean }).success === true &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }
    if (!err.response) {
      return "Unable to connect to server. Please check your internet connection.";
    }

    const status = err.response.status;
    const body = parseErrorBody(err.response.data);

    if (body?.errors?.length) {
      return body.errors[0]!.message;
    }
    if (body?.message) {
      return body.message;
    }

    return STATUS_FALLBACKS[status] ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export function getApiErrorCode(err: unknown): string | undefined {
  if (!isAxiosError(err)) return undefined;
  const body = parseErrorBody(err.response?.data);
  return body?.code;
}

export function extractResponseData<T>(response: AxiosResponse): T {
  return unwrapApiData<T>(response.data);
}

apiClient.interceptors.request.use((config) => {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("telemed-auth-token")
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  config.headers["Accept-Language"] = getAcceptLanguageHeader();

  if (config.data instanceof FormData) {
    config.data.append("locale", getApiLanguage());
    delete config.headers["Content-Type"];
  } else {
    const locale = getApiLanguage();
    const method = config.method?.toLowerCase();
    if (config.data && typeof config.data === "object" && !Array.isArray(config.data)) {
      config.data = { ...config.data, locale };
    } else if (method === "post" || method === "put" || method === "patch") {
      config.data = { ...(config.data ?? {}), locale };
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (err) => {
    if (!isAxiosError(err) || !err.response) {
      return Promise.reject(err);
    }

    const status = err.response.status;
    const url = err.config?.url ?? "";
    const isAuthAttempt = /\/auth\/(login|register)/.test(url);

    if (status === 401 && !isAuthAttempt) {
      const code = getApiErrorCode(err);
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (!path.startsWith("/login") && !path.startsWith("/register")) {
          const redirect = encodeURIComponent(path + window.location.search);
          window.location.assign(`/login?redirect=${redirect}`);
        }
      }
      if (code === "TOKEN_EXPIRED") {
        err.message = "Your session has expired. Please login again.";
      }
    }

    return Promise.reject(err);
  },
);
