import axios, { isAxiosError } from "axios";
import { API_BASE_URL } from "@/lib/constants";

const baseURL = API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

type ApiErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    try {
      if (typeof window !== "undefined") {
        const clerk = (window as any).Clerk;
        if (clerk?.session?.getToken) {
          const token = await clerk.session.getToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to get Clerk token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (data) {
      const message =
        typeof data.error === "string"
          ? data.error
          : typeof data.message === "string"
            ? data.message
            : typeof data.detail === "string"
              ? data.detail
              : null;
      if (message) error.message = message;
    }

    if (error.response?.status === 401) {
      console.error("Unauthorized");
    }
    if (error.response?.status === 403) {
      console.error("Forbidden");
    }
    if (error.response?.status >= 500) {
      console.error("Server Error");
    }
    return Promise.reject(error);
  }
);
