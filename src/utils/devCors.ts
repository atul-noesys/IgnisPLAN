import { AxiosInstance } from "axios";

const DEV_CORS_SECRET =
  "7f2c4e1a8b0d93c6e5f7412ab89dc35f6a1e4b7c90d2f8a3e6b5c1d4f7a9e2c8";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.location !== "undefined";
}

function isLocalhost(): boolean {
  if (!isBrowser()) {
    return false;
  }
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute the two dev-cors headers for a given request.
 * Returns an empty object when not running on localhost.
 */
export async function getDevCorsHeaders(
  method: string,
  url: string,
): Promise<Record<string, string>> {
  if (!isLocalhost()) {
    return {};
  }
  const parsed = new URL(url, window.location.origin);
  const origin = window.location.origin;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${timestamp}:${origin}:${method.toUpperCase()}:${parsed.pathname}`;
  const hmac = await hmacSha256Hex(DEV_CORS_SECRET, payload);
  return {
    "X-Infoveave-Timestamp": timestamp,
    "X-Infoveave-Secret": hmac,
  };
}

/**
 * Install a request interceptor that attaches X-Infoveave-Timestamp
 * and X-Infoveave-Secret on localhost. No-op in production.
 */
export function installDevCorsInterceptor(axiosInstance: AxiosInstance): void {
  if (!isLocalhost()) {
    return;
  }
  axiosInstance.interceptors.request.use(async (config) => {
    const fullUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;
    const headers = await getDevCorsHeaders(
      config.method?.toUpperCase() ?? "GET",
      fullUrl,
    );
    Object.assign(config.headers, headers);
    return config;
  });
}
