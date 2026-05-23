import axios, { isAxiosError } from "axios";
import { env } from "@/lib/env";
import { getAcceptLanguageHeader, getApiLanguage } from "@/lib/i18n-language";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error;
    }
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
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
