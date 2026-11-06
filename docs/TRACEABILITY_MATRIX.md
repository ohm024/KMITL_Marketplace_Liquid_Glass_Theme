# Requirement Traceability Matrix — KMITL Marketplace

Statuses are based on code included in this ZIP, **not claims about production acceptance**. `Implemented (MVP)` means endpoint/UI code exists; `Partial` means important integration or behavior is missing. Tests listed are automated tests when names are given; otherwise manual checks are proposed and should not be marked completed.

| Requirement | Behavior | Code / endpoint | Security requirement | Verification | Status |
|---|---|---|---|---|---|
| FR-1.1 | Institutional OTP login | `/auth/request-otp`, `/auth/verify-otp` | SR-01, SR-02 | `test_email_restriction_and_otp` | Implemented (MVP); SMTP setup needed |
| FR-1.2 | Edit profile fields | `/users/me` PATCH | SR-07 | manual: login + update | Implemented (MVP) |
| FR-1.3 | Verified badge | `users.py`, profile UI | SR-01 | `test_email_restriction_and_otp` | Implemented (MVP) |
| FR-2.1 | Create/edit/hide listings | `/listings` POST/PATCH/DELETE | SR-03 | `test_owner_and_reservation_and_review` | Implemented (MVP) |
| FR-2.2 | Upload 1–10 product images | `/listings/{id}/images` | SR-06 | `test_upload_rejects_wrong_type_and_compresses` | Partial: local/persistent storage only |
| FR-2.3 | Product details, condition, pickup | `Listing`, sell page | SR-03 | manual: create/list | Implemented (MVP) |
| FR-2.4 | Available / Reserved / Sold Out | reserve, cancel, complete | SR-03 | `test_owner_and_reservation_and_review` | Implemented (MVP) |
| FR-3.1 | Keyword search | `GET /listings?q=` | SQL parameterization | `test_filter_price_drop_csrf_and_chat` | Implemented (MVP) |
| FR-3.2 | Category filter | `GET /listings?category=` | Validated filters | manual | Implemented (MVP) |
| FR-3.3 | Price / condition / pickup | `GET /listings` filters | Validated filters | manual | Implemented (MVP); pickup filter API only |
| FR-3.4 | Newest / low-high / high-low | `GET /listings?sort=` | N/A | manual | Implemented (MVP) |
| FR-4.1 | Chat with instant updates | `/messages`, `/ws` | SR-05 | `test_filter_price_drop_csrf_and_chat` + manual two-browser WS | Partial: in-memory single-worker fanout |
| FR-4.2 | Image / location in chat | `ChatInput.kind` | SR-05 | manual | Partial: HTTPS image links and text pickup location; no native image upload/map pin |
| FR-5.1 | Review after completed deal | `/reviews` POST | SR-04 | `test_owner_and_reservation_and_review` | Implemented (MVP) |
| FR-5.2 | Seller average rating | `/users/{id}`, listing cards | SR-04 | `test_owner_and_reservation_and_review` | Implemented (MVP) |
| FR-6.1 | Message/reservation/price alerts | `/notifications` | SR-05 | manual + `test_filter_price_drop_csrf_and_chat` | Partial: in-app only; no FCM push |
| FR-6.2 | Report abuse | `/reports` POST | SR-07 | `test_reporting_requires_login` | Implemented (MVP) |
| FR-6.3 | Admin moderation | `/admin/*` | SR-08 | `test_admin_permissions` | Implemented (MVP) |
| NFR-1.1 | Password hash | OTP-only flow | SR-01 | architecture review | N/A, no passwords stored; OTP HMAC instead |
| NFR-1.2 | HTTPS / TLS 1.3 | reverse proxy / hosting | SR-09 | deployment check | Not verified |
| NFR-1.3 | Expiring API auth | signed HttpOnly session cookie JWT, 12h | SR-07 | login + auth test | Implemented (MVP) |
| NFR-2.1 | Pages ≤ 2 seconds | Next.js/SQL search | performance | benchmark | Not measured |
| NFR-2.2 | ≥1,000 concurrent users | infrastructure / tests | SR-10 | load test | Not measured |
| NFR-2.3 | Image compression | Pillow WebP quality 78 | SR-06 | upload test | Implemented (MVP) |
| NFR-3.1 | Responsive design | Tailwind UI | accessibility | mobile screen check | Code present, manual QA pending |
| NFR-3.2 | Listing in ≤3 steps | sell page | usability | usability check | Implemented (MVP) |
| NFR-4.1 | ≥99.5% uptime | monitoring/hosting | availability | uptime monitoring | Not measured |
| Integration: SMTP | Institutional OTP delivery | `security.py` | SR-01 | real mail test | Configurable; not live verified |
| Integration: Storage | Image storage | local Docker volume | SR-06 | cloud provider test | Cloud provider not integrated |
| Integration: FCM | Device push | not yet integrated | N/A | external FCM test | Not implemented |
| Integration: Maps | Coordinates/pin | text pickup location | N/A | map UI test | Not implemented |
| CI | Lint, TypeScript, tests/build | `.github/workflows/ci-cd.yml` | secure pipeline | GitHub Actions logs | Workflow authored, not remotely executed |
| CD | Deploy Render/Vercel | CI/CD deploy hooks | secure secrets | online URL + log | Workflow authored; requires secrets/services |
