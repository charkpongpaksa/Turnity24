/// <reference types="vite/client" />
/**
 * apiClient.ts
 * ─────────────────────────────────────────────────────────────────
 * Thin HTTP client wrapper for calling API Gateway endpoints.
 *
 * Features:
 *  - Reads base URL from VITE_API_BASE_URL environment variable
 *  - Attaches Authorization header (Bearer token from localStorage)
 *  - Handles JSON serialization / deserialization
 *  - Throws typed ApiError on non-2xx responses
 * ─────────────────────────────────────────────────────────────────
 */

import { appConfig } from "@/lib/config/env";
import { authSessionStore } from "@/features/auth/auth.storage";
import { AUTH } from "@/lib/apiEndpoints";

const BASE_URL = appConfig.apiBaseUrl;

// ─── Types ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the Authorization header (e.g. for /auth/login) */
  skipAuth?: boolean;
}

// ── Refresh logic ──────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((subscriber) => subscriber.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: Error) {
  refreshSubscribers.forEach((subscriber) => subscriber.reject(error));
  refreshSubscribers = [];
}

async function attemptRefresh(): Promise<string | null> {
  const session = authSessionStore.get();
  const refreshToken = session?.refreshToken;

  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}${AUTH.REFRESH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error("Refresh failed");

    const data = await response.json() as { 
      accessToken: string; 
      refreshToken: string; 
      expiresAt: string 
    };
    
    if (session) {
      authSessionStore.set({
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: new Date(data.expiresAt).toISOString(),
      });
    }
    
    return data.accessToken;
  } catch (error) {
    authSessionStore.clear();
    onRefreshFailed(
      error instanceof Error ? error : new Error("Refresh token request failed")
    );
    window.location.href = "/login";
    return null;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const session = authSessionStore.get();
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Parse body if content exists
    let data: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    }

    if (response.status === 401 && !skipAuth) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await attemptRefresh();
        isRefreshing = false;
        if (newToken) {
          onTokenRefreshed(newToken);
          return request<T>(path, options);
        }
      } else {
        return new Promise<T>((resolve, reject) => {
          refreshSubscribers.push({
            resolve: () => {
              resolve(request<T>(path, options));
            },
            reject,
          });
        });
      }
    }

    if (!response.ok) {
      const err = data as { message?: string; code?: string } | undefined;
      throw new ApiError(
        response.status,
        err?.code ?? "UNKNOWN_ERROR",
        err?.message ?? `HTTP ${response.status}`
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(error instanceof Error ? error.message : "Network error");
  }
}

// ─── Convenience methods ──────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),

  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>(path, { method: "DELETE", ...options }),
};

// ─── File upload via pre-signed S3 URL ───────────────────────────

export async function uploadToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timeout = window.setTimeout(() => {
      xhr.abort();
      reject(new Error("S3 upload timed out. Please try again."));
    }, 60000);
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      window.clearTimeout(timeout);
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("S3 upload network error"));
    };
    xhr.onabort = () => {
      window.clearTimeout(timeout);
      reject(new Error("S3 upload was cancelled."));
    };

    xhr.send(file);
  });
}
