# Production Readiness Checklist

Use this checklist before merging `backend` into `main` or deploying a public demo.

## Final Manual QA

- [ ] Register, login, refresh, logout, and protected-route redirects work.
- [ ] Create a mentor session.
- [ ] Learner books the session and credits are reserved.
- [ ] Mentor accepts and a Jitsi link appears.
- [ ] Mentor completes and escrow releases exactly once.
- [ ] Learner can review only after completion.
- [ ] Cancellation and rejection refund exactly once.
- [ ] Notification unread count, read one, and read all work.
- [ ] Global search returns expected sessions, mentors, and skills.
- [ ] Bad payloads return safe JSON errors.
- [ ] Mobile layouts are checked at small and tablet widths.
- [ ] Keyboard navigation is checked for auth, marketplace, bookings, and notifications.

## Deployment Checklist

- [ ] `MONGODB_URI` points to Atlas or a replica set.
- [ ] `REQUIRE_TRANSACTION_DB=true`.
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique and 32+ characters.
- [ ] `CLIENT_URL` includes exact production frontend origin.
- [ ] Vercel `VITE_API_URL` points to the Render API base ending in `/api`.
- [ ] `COOKIE_SECURE=true` for HTTPS production.
- [ ] `COOKIE_SAMESITE=none` for cross-domain Vercel + Render deployments.
- [ ] Upload storage limitation is accepted for demo or replaced with durable object storage.
- [ ] Render health check path is `/api/health`.
- [ ] Vercel output directory is `dist`.

## CI Checklist

- [ ] Backend Jest suite passes.
- [ ] Frontend production build passes.
- [ ] Docker backend image builds.
- [ ] Docker frontend image builds.
- [ ] CI uses MongoDB service initialized as a replica set.
- [ ] Failure output is clear enough to identify the failing suite.

## Docker Validation Checklist

- [ ] `cp .env.docker.example .env.docker`.
- [ ] Replace Docker JWT secrets.
- [ ] `docker compose up --build` starts all services.
- [ ] `http://localhost:8080` loads the app.
- [ ] `http://localhost:5000/api/health` returns success.
- [ ] Booking lifecycle works through the Docker stack.
- [ ] `docker compose down` stops services cleanly.

## Rollback Plan

- Keep the previous Render deployment available.
- Use Vercel's deployment history for instant frontend rollback.
- If booking or escrow behavior regresses, stop accepting new bookings before changing ledger data.
- Prefer additive correction transactions over deleting or editing ledger records.
- Document any manual credit correction with user IDs, booking IDs, reason, and timestamp.

## Known Limitations

- Local test execution requires a running MongoDB replica set or Atlas test URI.
- Docker validation requires Docker Desktop or Docker Engine to be running.
- Profile uploads are stored on the local filesystem by default.
- Mentor application, assignments, and referral pages are frontend/demo workflows, not dedicated persisted backend APIs yet.
- Browser end-to-end tests are not included.
- No license file is currently present.
