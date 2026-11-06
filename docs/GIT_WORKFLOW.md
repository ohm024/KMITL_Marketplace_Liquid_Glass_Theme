# Git Collaboration Workflow (recommended for team)

This project ZIP is not a GitHub repository, and **does not contain genuine team commit / PR evidence**. Do not describe sample commit history as real until the team has executed these steps on their repository.

## Feature branching

- `main`: stable, deployable version; protected branch.
- `feature/auth-otp`: authentication and profiles.
- `feature/product-listings`: product CRUD, filters, images.
- `feature/chat-reviews`: realtime, reviews, notifications.
- `feature/security-qa`: threat controls, tests and refactoring.
- `feature/ci-cd`: workflow, deployment configuration.

## Typical procedure (Windows Git Bash or terminal)

```bash
git init
git add .
git commit -m "chore: initialize KMITL Marketplace monorepo"
git branch -M main
git remote add origin https://github.com/REPLACE-WITH-TEAM/REPLACE-WITH-REPO.git
git push -u origin main

git checkout -b feature/auth-otp
# Edit files; run checks before committing
git add backend/app/routers/auth.py backend/app/security.py
git commit -m "feat(auth): add expiring institutional email OTP flow"
git push -u origin feature/auth-otp
# Open PR targeting main, request review, address comments, merge after CI passes.
```

## Meaningful commit samples (**illustrative, not actual history**)

- `feat(listings): enforce seller ownership in update endpoint`
- `fix(auth): prevent rapid OTP resends after verification`
- `test(reservation): cover duplicate booking and duplicate review`
- `refactor(listings): introduce repository protocol for persistence`
- `ci: validate backend tests and Next.js production build`
- `docs(security): add STRIDE DFD and risk register`

## Pull Request template

```md
### Summary
Added booking state machine and ownership authorization.
### Related requirement
FR-2.4; SR-03, SR-04
### Evidence
- [ ] Unit tests pass
- [ ] Manual booking, cancel and sold-out demo passes
- [ ] Screenshot or short screen recording attached
### Review checklist
- [ ] No secrets committed
- [ ] Input validation / ownership checks
- [ ] Naming, PEP 8, readable code
- [ ] API contract does not break frontend
```

## Screenshot checklist for teacher

1. GitHub Branches list with real feature branches.
2. GitHub commit timeline showing actual contributions per member.
3. Pull Request showing reviewer comments and a change made after review.
4. GitHub Actions green CI checks and failing-test example (if genuine).
5. Deployment success logs and a working public URL (when completed).
