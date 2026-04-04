# Sentinel's Journal

## 2025-05-14 - Input Validation for DoS Prevention
**Vulnerability:** Many Convex mutations accepted strings of arbitrary length, which could lead to database bloat or Denial of Service (DoS) if an attacker (or a malfunctioning bridge) sent extremely large payloads.
**Learning:** Even internal mutations or those protected by a shared secret (like the bridge) should have defense-in-depth via input validation.
**Prevention:** Always apply `.slice()` or similar length constraints to user-provided or external strings before database insertion.
