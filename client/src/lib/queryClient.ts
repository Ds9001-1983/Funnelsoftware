import { QueryClient, QueryFunction } from "@tanstack/react-query";

// CSRF Token Management
let csrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<void> {
  try {
    const res = await fetch("/api/auth/csrf-token", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken;
    }
  } catch {
    // Silently fail - token will be fetched on next request
  }
}

// Fetch CSRF token on module load
fetchCsrfToken();

export class ApiError extends Error {
  status: number;
  code?: string;
  body?: unknown;

  constructor(status: number, message: string, code?: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function throwIfResNotOk(res: Response) {
  if (res.ok) return;
  const text = (await res.text()) || res.statusText;
  let code: string | undefined;
  let message = text;
  let body: unknown;
  try {
    body = JSON.parse(text);
    if (body && typeof body === "object") {
      const b = body as { code?: string; error?: string; message?: string };
      code = b.code;
      message = b.error || b.message || text;
    }
  } catch {
    // not JSON — keep raw text as message
  }
  throw new ApiError(res.status, message, code, body);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  // Add CSRF token for state-changing requests
  if (csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If CSRF token expired, refresh and retry once
  if (res.status === 403 && !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    // Don't retry known application-level 403s (not CSRF errors)
    const cloned = res.clone();
    try {
      const body = await cloned.json();
      if (body.code === "TRIAL_EXPIRED" || body.code === "EMAIL_NOT_VERIFIED") {
        await throwIfResNotOk(res);
        return res;
      }
    } catch {
      // Not JSON — continue with CSRF retry
    }

    await fetchCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
      const retryRes = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      await throwIfResNotOk(retryRes);
      return retryRes;
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000, // 30 Sekunden
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
