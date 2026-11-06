# Risk Register (Proposed Assessment)

Scale: Likelihood L = 1 rare ... 5 frequent; Impact I = 1 minor ... 5 critical. Score = L × I; 15–25 High, 8–14 Medium, 1–7 Low. This is an **initial analysis**, not observed incident history.

| ID | Risk | Asset | L | I | Score | Priority | Mitigation / Treatment | Owner (proposed) |
|---|---|---|---:|---:|---:|---|---|---|
| R-01 | OTP brute-force / mail abuse | A1, A3 | 4 | 4 | 16 | High | 5 attempts, cooldown, expiry; add IP rate limits | Backend / Security |
| R-02 | Insecure object-level authorization | A4 | 3 | 5 | 15 | High | Owner check on mutations, tests | Backend |
| R-03 | Malicious image / decompression bomb | A7 | 3 | 4 | 12 | Medium | 5 MB, 12 MP, Pillow re-encoding; antivirus later | Backend |
| R-04 | Session theft and cross-site request | A2 | 3 | 5 | 15 | High | HttpOnly/Secure cookie, Origin allowlist, HTTPS | Security / Deploy |
| R-05 | Duplicate reservation under load | A4, A6 | 3 | 4 | 12 | Medium | DB row lock in PostgreSQL; concurrency test pending | Backend / QA |
| R-06 | Unauthorized chat disclosure | A5 | 3 | 5 | 15 | High | Partner validation on API + WS origin | Backend |
| R-07 | Admin privilege bypass | A8 | 2 | 5 | 10 | Medium | Email allowlist server-side, never user-supplied | Security |
| R-08 | Lost uploaded images after cloud restart | A7 | 4 | 3 | 12 | Medium | Persistent Docker volume; cloud object store planned | DevOps |
| R-09 | Downtime / DB saturation with 1,000 users | A4 | 4 | 4 | 16 | High | Load test, pooling, caching, infra sizing pending | DevOps |
| R-10 | Leaked credentials / deploy hooks | A2, A9 | 3 | 5 | 15 | High | GitHub Secrets, `.gitignore`, rotation policy | DevOps |
| R-11 | Real-time chat breaks across replicas | A5 | 4 | 3 | 12 | Medium | Single worker for MVP; Redis pub/sub planned | Backend |
| R-12 | Misuse reports without audit history | A8 | 3 | 3 | 9 | Medium | Store reports/status; immutable audit events planned | Admin |

**Top remediation backlog:** IP-based abuse protection, hardened deployment with proper domains, cloud file storage, Postgres concurrency tests, immutable moderation audit, load testing, distributed WebSocket implementation.
