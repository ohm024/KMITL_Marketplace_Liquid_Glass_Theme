# Animation fix (2026-11-07)

This archive is the full KMITL Marketplace Animated project with the revised `frontend/components/ui/aether-flow-hero.tsx`.

Changes:
- Canvas sizing is initialized even with `prefers-reduced-motion: reduce`.
- Reduced-motion mode shows a static particle field instead of starting an animation loop.
- Canvas is drawn above the radial gradient but behind the hero text.

Run on Windows with Docker Desktop:

```powershell
docker compose up --build
```

Then open http://localhost:3000.

If TypeScript errors appear in VS Code, run `cd frontend; npm install; npm run typecheck`.

Note: Browser animation and full Docker build have not been verified in this environment.
