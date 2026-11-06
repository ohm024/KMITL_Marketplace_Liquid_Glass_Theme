# KMITL Marketplace — Software Design and Development 2

**Stack:** Next.js (React) + Tailwind CSS, Python FastAPI, PostgreSQL, Docker Compose, GitHub Actions CI/CD.

This is a functional **academic MVP source project**, not a finished public service and not an official KMITL website. Source requirements: `docs/Original_Requirement.txt`.

## Quick start on Windows / VS Code (recommended: Docker Desktop)

1. Install **Docker Desktop**, VS Code and Git. Open this folder in VS Code.
2. Open VS Code terminal **at the root `KMITL_Marketplace`** (contains `docker-compose.yml`).
3. Run:

```bash
docker compose up --build
```

4. Wait for services to start and open:
   - Frontend: http://localhost:3000
   - Interactive API Docs: http://localhost:8000/docs
   - Backend health: http://localhost:8000/health
5. Log in using `student01@kmitl.ac.th` (an **example address**, not a real credential). In *local development mode without SMTP*, OTP appears **on the login page**. It is deliberately not delivered to email until you configure SMTP.
6. Sell a listing, then use a second browser session/incognito window to log in as `student02@kmitl.ac.th`, reserve and chat. The seller can confirm Sold, then the buyer can review.
7. Stop with `Ctrl+C`; to delete local containers and database data **only if you intentionally want a reset**: `docker compose down -v`.

**NOTE:** Docker image builds require internet for pulling container images and npm/pip packages. They could not be performed in this isolated environment; see **Testing status** below.

## Manual setup without Docker (quick backend-only demo with SQLite)

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Change `DATABASE_URL` in `backend/.env` to `sqlite:///./marketplace.db` **for local development only**. Then:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Open another terminal:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

If you want actual PostgreSQL instead of SQLite, keep the PostgreSQL URL in `.env` and launch a compatible PostgreSQL server at localhost:5432 with the configured database/user/password, or use Docker Compose.

## Project tree

```text
KMITL_Marketplace/
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # Reusable navigation and listing cards
│   ├── lib/api.ts             # Browser API client + shared types
│   └── Dockerfile
├── backend/
│   ├── app/
│   │   ├── main.py            # Application, middleware, WebSocket
│   │   ├── database.py        # SQLAlchemy engine and sessions
│   │   ├── models.py          # OOP/ORM entities
│   │   ├── schemas.py         # Request validation
│   │   ├── security.py        # OTP, email and JWT session
│   │   ├── repositories.py    # ListingRepository Protocol + implementation
│   │   ├── listing_service.py # SOLID business rules
│   │   ├── realtime.py        # Chat event fanout
│   │   └── routers/           # Auth, users, listings, community
│   ├── tests/                 # Pytest
│   └── Dockerfile
├── .github/workflows/ci-cd.yml
├── docker-compose.yml
└── docs/                       # Class/DFD/Threat/Risk/Traceability/Git/Slides
```

## What is implemented in this MVP

- Institutional email OTP, 5-minute expiry, HMAC at rest, cooldown and attempt counter. Demo OTP displayed only when `ENV=development` and SMTP is not configured.
- Verified login, profile editing, signed JWT HttpOnly cookie with 12-hour expiration, CORS and CSRF Origin check.
- Product CRUD with ownership, images (0–10; WebP compressed upload, 5 MB limit), searchable listings, categories, price, condition, pickup location and sort.
- Booking state transitions `available -> reserved -> sold`, cancel reservation, booking eligibility for reviews.
- Messages between buyer and seller via REST + WebSocket event notifications in a single backend worker; message types text, HTTPS image URL and pickup-location text.
- Reviews, seller averages, favorites, in-app notifications for chat/reservations/price changes, reports and admin moderation endpoints.
- Docker Compose with PostgreSQL, GitHub Actions CI file and conditional CD deploy hooks.
- Architecture, DFD, STRIDE, asset list, risk register, traceability matrix, slides plan and Git workflow guidance.

## Explicit limitations (required before claiming full completion)

- **Not verified**: real production SMTP, Render/Vercel deployment, HTTPS/TLS 1.3, target 2-second response, 1,000 concurrent users, 99.5% availability.
- **Not implemented**: Firebase push notifications, native map pin integration, true image sending in chat (currently image HTTPS links), cloud object storage and dedicated SSO.
- WebSocket realtime events use in-memory fanout and one worker; cross-worker Redis pub/sub is a future improvement.
- Admin decisions lack immutable audit logs. Image storage in Docker is persisted via volume; on hosted platforms, deploy a persistent disk or implement S3/Cloudinary before real use.
- Database tables are created with `create_all()` for ease of local setup; add Alembic migrations before production.
- Git commit history, PR reviews, GitHub Actions logs and public URLs are not fabricated and must be collected from a real team repository/deployment.
- Security review, accessibility, browser compatibility and load/penetration tests require further verification.

## Automated tests

```bash
cd backend
pytest -q tests
```

For quality checks:

```bash
ruff check app tests --select E4,E7,E9,F
# in frontend
npm run lint
npm run typecheck
npm run build
```

The 8 backend pytest tests succeeded locally with SQLite. Frontend npm install/build and PostgreSQL-in-Docker were **not run in the isolated environment**, which had no external npm network access or Docker binary. GitHub Actions can validate them after pushing to GitHub.

## Configure production services

Backend hosting (e.g. Render) needs `ENV=production`, `DATABASE_URL=postgresql+psycopg://...`, `SECRET_KEY` (secure random 32+ chars), `FRONTEND_ORIGINS=https://your-web-domain`, `API_PUBLIC_URL=https://your-backend-domain`, SMTP_HOST/PORT/USERNAME/PASSWORD/FROM and storage persistence.

Frontend hosting (e.g. Vercel) needs `NEXT_PUBLIC_API_URL=https://your-backend-domain` **at build time**. `frontend` is the Root Directory.

Cookies use `SameSite=None; Secure` in production because the web and API may be on different domains. Some browsers block third-party cookies: for reliable production use, prefer **custom subdomains under one site** and design a same-origin proxy. HTTPS must be supplied by the hosting reverse proxy and validated via an external browser test; code alone does not enforce TLS 1.3.

### CI and CD setup (40%-weighted security coursework)

1. Create a GitHub repository and push this folder.
2. Set branch protection for `main` and require CI checks.
3. Create Render backend project and Vercel frontend project linked to the repository, set their environment variables.
4. Create a Render deploy hook and a Vercel deploy hook for main and store them in **GitHub Actions Repository Secrets** as `RENDER_DEPLOY_HOOK_URL` and `VERCEL_DEPLOY_HOOK_URL`. Do not commit them to source control. Optionally set `PUBLIC_API_HEALTH_URL`.
5. Open a PR; CI should lint/test/build. Merge to `main`; CD job invokes configured hooks. Capture actual run logs and successful public website as **evidence**, not merely a pipeline YAML screenshot.
6. Avoid duplicate deployments: if using Git integration auto-deploy, turn off automatic deploys where you want GitHub Actions gates to control releases. Also record that deploy hooks trigger asynchronous builds; success of curl **does not guarantee** the new version is live.

External references: https://render.com/docs/deploy-hooks and https://vercel.com/docs/deploy-hooks .

## Git collaboration & instructor artifacts

- `docs/ARCHITECTURE.md` — system component/layers and class diagram, 2 real code examples demonstrating SOLID.
- `docs/THREAT_MODEL.md` — DFD, trust boundaries, STRIDE, misuse cases, asset list and derived SR.
- `docs/RISK_REGISTER.md` — 12 scored risks and proposed owners.
- `docs/TRACEABILITY_MATRIX.md` — requirement → code/control → test → verified status.
- `docs/GIT_WORKFLOW.md` — sample branching, PR procedure and evidence checklist (**samples are not real commits**).
- `docs/PRESENTATION_PLAN_TH.md` — slide-by-slide Thai plan for both professors and live-demo script.

## Suggested team division

- Person A: Frontend/UI, responsive layout, browser validation.
- Person B: Backend models, auth and listings / SOLID refactoring.
- Person C: Chat, reviews, reports and integration tests.
- Person D: STRIDE, risk, GitHub PR reviews, CI/CD and deployment.

Members should each create feature branches and genuine commits. Every PR should pass CI and include screenshots and security checks. See `docs/GIT_WORKFLOW.md`.
