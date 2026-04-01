import { getQuery, sendRedirect } from "h3";
import { runAuthSignIn, setAuthCookie } from "../../utils/convexAuth";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const redirectTo =
    typeof query.redirectTo === "string" && query.redirectTo
      ? query.redirectTo
      : "/tasks";

  const result = await runAuthSignIn(event, {
    provider: "github",
    params: { redirectTo },
  });

  if (!result.redirect || !result.verifier) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to start GitHub sign-in flow",
    });
  }

  setAuthCookie(event, "verifier", result.verifier);
  return sendRedirect(event, result.redirect, 302);
});
