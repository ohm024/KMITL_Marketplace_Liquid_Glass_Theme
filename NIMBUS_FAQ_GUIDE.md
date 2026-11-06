# Nimbus Liquid Glass FAQ integration

- Existing homepage hero (`frontend/components/ui/aether-flow-hero.tsx`) **unchanged**. Existing navbar, API, search, and listing cards **unchanged**.
- Imported the supplied `LiquidAccordion` in `frontend/app/page.tsx` and added FAQ beneath the marketplace listing area.
- Component source: `frontend/components/ui/liquid-glass-accordion.tsx` (user-supplied Nimbus UI / guglielmogiannattasio.it). Uses React + WebGL with CSS fallback. No new npm dependencies.
- shadcn-compatible `frontend/components.json` added; existing TypeScript alias `@/*`, Tailwind v4 and `components/ui/` already present. Running shadcn CLI is **not necessary** for this standalone component.
- FAQ copy is illustrative; email delivery depends on SMTP configuration. Audio deliberately disabled (`sound={false}`).

## Run

From the project root:

```powershell
docker compose up -d --build --force-recreate
```

Open `http://localhost:3000`, scroll below the product listings and click the FAQ items.

## Test frontend types

```powershell
cd frontend
npm install
npx tsc --noEmit
```

## Git

Use a feature branch (e.g. `feature/liquid-faq`) and a PR; do not replace the group's main branch directly.
