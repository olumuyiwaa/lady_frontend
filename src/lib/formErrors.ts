/**
 * Shape of an error thrown by the API clients for a failed request. `errors`
 * carries the backend's per-field validation messages (HTTP 422).
 */
export type ApiError = Error & {
  status?: number;
  errors?: { field?: string; message?: string }[] | null;
};

/** Message for a failed form submit: the first field message if the server gave one. */
export function formErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiError | null;
  const fieldMessage = e?.errors?.find((x) => x?.message)?.message;
  if (fieldMessage) return fieldMessage;
  if (e?.message && e.message !== "Request failed" && e.message !== "Validation failed") return e.message;
  return fallback;
}

/** Map backend field errors to { field: message } so inputs can show them inline. */
export function fieldErrorMap(err: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const x of (err as ApiError | null)?.errors ?? []) {
    if (x?.field && x.message && !out[x.field]) out[x.field] = x.message;
  }
  return out;
}

/**
 * Base URL of the Lady Greener API. In development a missing variable falls back
 * to the local API; in production it is a configuration error and must be
 * visible, not a silent request to localhost.
 */
export function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV !== "production") return "http://localhost:8000/api/v1";
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
}
