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

// ─── Token helpers ────────────────────────────────────────────────

const TOKEN_KEY = "turnity_token";

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

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
    const token = tokenStore.get();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

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

  if (!response.ok) {
    const err = data as { message?: string; code?: string } | undefined;
    throw new ApiError(
      response.status,
      err?.code ?? "UNKNOWN_ERROR",
      err?.message ?? `HTTP ${response.status}`
    );
  }

  return data as T;
}

// ─── Convenience methods ──────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};

// ─── File upload via pre-signed S3 URL ───────────────────────────

/**
 * Upload a file directly to S3 using a pre-signed URL obtained from Lambda.
 *
 * Usage:
 *   const { uploadUrl, publicUrl } = await api.post(FILES.PRESIGNED_UPLOAD, {
 *     filename: file.name,
 *     contentType: file.type,
 *   });
 *   await uploadToS3(uploadUrl, file);
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("S3 upload network error"));

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
