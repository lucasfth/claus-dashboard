# Sentinel's Journal

## 2025-05-14 - Input Validation for DoS Prevention
**Vulnerability:** Many Convex mutations accepted strings of arbitrary length, which could lead to database bloat or Denial of Service (DoS) if an attacker (or a malfunctioning bridge) sent extremely large payloads.
**Learning:** Even internal mutations or those protected by a shared secret (like the bridge) should have defense-in-depth via input validation.
**Prevention:** Always apply `.slice()` or similar length constraints to user-provided or external strings before database insertion.

## 2025-05-15 - Open Redirect Prevention
**Vulnerability:** The OAuth sign-in and callback handlers accepted a `redirectTo` query parameter without validation, allowing attackers to construct links that would redirect users to malicious external domains after a successful login.
**Learning:** Post-authentication redirects must always be validated to ensure they are internal to the application.
**Prevention:** Use a utility like `isSafeRedirect` to verify that the redirect path starts with a single `/` and not `//`, preventing off-site redirection.
