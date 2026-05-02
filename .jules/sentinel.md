# Sentinel's Journal

## 2025-05-14 - Input Validation for DoS Prevention
**Vulnerability:** Many Convex mutations accepted strings of arbitrary length, which could lead to database bloat or Denial of Service (DoS) if an attacker (or a malfunctioning bridge) sent extremely large payloads.
**Learning:** Even internal mutations or those protected by a shared secret (like the bridge) should have defense-in-depth via input validation.
**Prevention:** Always apply `.slice()` or similar length constraints to user-provided or external strings before database insertion.

## 2025-05-15 - Open Redirect Prevention
**Vulnerability:** The OAuth sign-in and callback handlers accepted a `redirectTo` query parameter without validation, allowing attackers to construct links that would redirect users to malicious external domains after a successful login.
**Learning:** Post-authentication redirects must always be validated to ensure they are internal to the application.
**Prevention:** Use a utility like `isSafeRedirect` to verify that the redirect path starts with a single `/` and not `//`, preventing off-site redirection.

## 2025-05-16 - Validation vs Truncation in Synchronization
**Vulnerability:** Resource limits implemented via silent truncation and query capping (`.take(limit)`) in synchronization logic (like `upsertMany`) can lead to partial updates, stale data, or accidental deletion of records not included in the capped result set.
**Learning:** Security constraints must respect the integrity of the underlying business logic. Silent truncation can corrupt configuration data (e.g., cron strings or LLM prompts).
**Prevention:** Prefer explicit validation (throwing errors for oversized payloads) over silent truncation. For synchronization, apply limits to the total count at the point of insertion rather than capping the reconciliation query itself.

## 2025-05-17 - Robust Open Redirect Validation
**Vulnerability:** The initial `isSafeRedirect` implementation only checked for `//` to prevent off-site redirects, which could be bypassed using `/\` as some browsers normalize the backslash to a forward slash.
**Learning:** Simple string prefix checks are often insufficient for URL validation due to browser-specific normalization behaviors.
**Prevention:** Use a regex like `/^\/(?!\/|\\)/` to explicitly reject both double slashes and backslash-slash combinations at the start of a redirect path.
