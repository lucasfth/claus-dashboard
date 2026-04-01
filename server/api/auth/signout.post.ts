import {
  getAuthCookie,
  runAuthSignOut,
  setAuthCookie,
} from "../../utils/convexAuth";

export default defineEventHandler(async (event) => {
  const token = getAuthCookie(event, "token") ?? undefined;

  try {
    await runAuthSignOut(event, token);
  } catch {
    // Always clear local auth cookies even if Convex sign-out fails.
  }

  setAuthCookie(event, "token", null);
  setAuthCookie(event, "refreshToken", null);
  setAuthCookie(event, "verifier", null);

  return { ok: true };
});
