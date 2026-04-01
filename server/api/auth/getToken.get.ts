import { getQuery } from "h3";
import {
  decodeTokenExpMs,
  getAuthCookie,
  runAuthSignIn,
  setAuthCookie,
} from "../../utils/convexAuth";

const MIN_TOKEN_LIFETIME_MS = 60_000;

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const forceRefresh = query.forceRefreshToken === "true";

  const token = getAuthCookie(event, "token");
  const refreshToken = getAuthCookie(event, "refreshToken");

  if (!forceRefresh && token) {
    const expMs = decodeTokenExpMs(token);
    if (expMs && expMs > Date.now() + MIN_TOKEN_LIFETIME_MS) {
      return { token };
    }
  }

  if (!refreshToken) {
    if (!token) return { token: null };
    setAuthCookie(event, "token", null);
    setAuthCookie(event, "refreshToken", null);
    return { token: null };
  }

  try {
    const result = await runAuthSignIn(event, { refreshToken });
    const tokens = result.tokens;
    if (!tokens?.token || !tokens.refreshToken) {
      setAuthCookie(event, "token", null);
      setAuthCookie(event, "refreshToken", null);
      return { token: null };
    }

    setAuthCookie(event, "token", tokens.token);
    setAuthCookie(event, "refreshToken", tokens.refreshToken);
    return { token: tokens.token };
  } catch {
    setAuthCookie(event, "token", null);
    setAuthCookie(event, "refreshToken", null);
    return { token: null };
  }
});
