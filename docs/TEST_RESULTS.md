# Test Execution Evidence — 2026-11-05

## Local execution results (actual)

**Command:** `python -m pytest -q backend/tests` from project root.

```text
........                                                                 [100%]
8 passed in 0.43s
```

**Backend Python:** `compileall` passed.

**Frontend TS/TSX:** 14 source files parsed with TypeScript compiler's parser; **0 syntax diagnostics**. This syntax check does not replace actual `npm install`, Next.js production build or typechecking.

**Test cases:**

- `test_email_restriction_and_otp`: @kmitl email restriction, verified profile, OTP resend limit.
- `test_owner_and_reservation_and_review`: listing ownership check, reserve duplicate, completed purchase, one review.
- `test_filter_price_drop_csrf_and_chat`: search, CSRF Origin rejection, chat request and seller conversation.
- `test_reporting_requires_login`: unauthenticated reporting rejected.
- `test_service_accepts_fake_repository`: DIP substitutability and authorization.
- `test_admin_permissions`: normal-user/admin authorization, report, removal and resolution.
- `test_upload_rejects_wrong_type_and_compresses`: invalid SVG rejected, PNG → WebP upload, avatar upload.
- `test_otp_fails_for_invalid_code`: malformed and wrong OTP attempts rejected.

## Not executed in the current environment

- Frontend dependency install, `npm run lint`, `npm run typecheck`, `npm run build` (package registry unreachable in local runner).
- Docker Compose with PostgreSQL (Docker binary not available).
- True production SMTP, GitHub Actions workflows and CD deploy hooks (credentials/repository not connected).
- External security scan, stress/load tests, 99.5% uptime monitoring, TLS 1.3 audit.

## Teacher-facing evidence to collect after deploying

Actual GitHub Actions job logs with green checks, actual Render/Vercel deploy logs, public URL, `/health`, database connectivity, responsive screenshots, live chat from two browsers, deliberate API 403/409 and actual real team PR review comments.
