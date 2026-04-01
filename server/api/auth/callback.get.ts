import { getQuery, sendRedirect } from "h3";
import {
  getAuthCookie,
  runAuthSignIn,
  setAuthCookie,
} from "../../utils/convexAuth";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = typeof query.code === "string" ? query.code : undefined;
  const redirectTo =
    typeof query.redirectTo === "string" && query.redirectTo
      ? query.redirectTo
      : "/tasks";

  if (!code) {
    return sendRedirect(event, "/login", 302);
  }

  const verifier = getAuthCookie(event, "verifier") ?? undefined;

  try {
    const result = await runAuthSignIn(event, {
      params: { code },
      verifier,
    });

    const tokens = result.tokens;
    if (!tokens?.token || !tokens.refreshToken) {
      setAuthCookie(event, "token", null);
      setAuthCookie(event, "refreshToken", null);
      setAuthCookie(event, "verifier", null);
      return sendRedirect(event, "/login", 302);
    }

    setAuthCookie(event, "token", tokens.token);
    setAuthCookie(event, "refreshToken", tokens.refreshToken);
    setAuthCookie(event, "verifier", null);
    return sendRedirect(event, redirectTo, 302);
  } catch {
    setAuthCookie(event, "token", null);
    setAuthCookie(event, "refreshToken", null);
    setAuthCookie(event, "verifier", null);
    return sendRedirect(event, "/login", 302);
  }
});
