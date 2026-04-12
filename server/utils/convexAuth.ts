import type { H3Event } from "h3";
import { getCookie, setCookie } from "h3";
import { ConvexHttpClient } from "convex/browser";

type CookieKind = "token" | "refreshToken" | "verifier";

type AuthTokens = {
  token: string;
  refreshToken: string;
};

type SignInResult = {
  redirect?: string;
  verifier?: string;
  tokens?: AuthTokens | null;
};

const COOKIE_SUFFIX: Record<CookieKind, string> = {
  token: "__convexAuthJWT",
  refreshToken: "__convexAuthRefreshToken",
  verifier: "__convexAuthOAuthVerifier",
};

function isLocalHost(host?: string | null): boolean {
  if (!host) return true;
  const normalized = host.toLowerCase();
  return (
    normalized.startsWith("localhost:") || normalized.startsWith("127.0.0.1:")
  );
}

function cookieName(event: H3Event, kind: CookieKind): string {
  const prefix = isLocalHost(event.node.req.headers.host) ? "" : "__Host-";
  return `${prefix}${COOKIE_SUFFIX[kind]}`;
}

export function getAuthCookie(event: H3Event, kind: CookieKind): string | null {
  return getCookie(event, cookieName(event, kind)) ?? null;
}

/**
 * Validates that a redirect URL is safe (internal to the application)
 * to prevent open redirect vulnerabilities.
 */
export function isSafeRedirect(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("/") && !url.startsWith("//");
}

export function setAuthCookie(
  event: H3Event,
  kind: CookieKind,
  value: string | null,
) {
  setCookie(event, cookieName(event, kind), value ?? "", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: !isLocalHost(event.node.req.headers.host),
    maxAge: value ? undefined : 0,
  });
}

function getConvexUrl(event: H3Event): string {
  const config = useRuntimeConfig(event);
  const url = config.public.convexUrl;
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: "NUXT_PUBLIC_CONVEX_URL is not configured",
    });
  }
  return url;
}

export async function runAuthSignIn(
  event: H3Event,
  args: Record<string, unknown>,
  token?: string,
): Promise<SignInResult> {
  const client = new ConvexHttpClient(getConvexUrl(event));
  if (token) {
    client.setAuth(async () => token);
  }
  return (await client.action("auth:signIn" as any, args)) as SignInResult;
}

export async function runAuthSignOut(
  event: H3Event,
  token?: string,
): Promise<void> {
  const client = new ConvexHttpClient(getConvexUrl(event));
  if (token) {
    client.setAuth(async () => token);
  }
  await client.action("auth:signOut" as any, {});
}

export function decodeTokenExpMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    if (typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}
