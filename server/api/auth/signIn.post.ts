import { readBody } from "h3";
import { runAuthSignIn, setAuthCookie } from "../../utils/convexAuth";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const provider = body?.provider;
  const params = body?.params;

  if (!provider || !params) {
    event.node.res.statusCode = 400;
    return { message: "Missing provider or params" };
  }

  // Currently only password sign-in/sign-up is supported from login page
  if (provider !== "password") {
    event.node.res.statusCode = 400;
    return { message: "Unsupported auth provider" };
  }

  try {
    const result = await runAuthSignIn(event, { provider, params });

    if (result.tokens?.token) {
      setAuthCookie(event, "token", result.tokens.token);
    }
    if (result.tokens?.refreshToken) {
      setAuthCookie(event, "refreshToken", result.tokens.refreshToken);
    }

    return {
      ok: true,
      ...result,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in";

    if (message.includes("already exists")) {
      event.node.res.statusCode = 409;
      return { message: "Account exists. Please sign in instead." };
    }

    if (message.includes("InvalidSecret") || message.includes("Invalid credentials")) {
      event.node.res.statusCode = 401;
      return { message: "Invalid email or password" };
    }

    event.node.res.statusCode = 400;
    return { message };
  }
});
