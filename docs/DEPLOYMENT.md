# Deployment Guide

This guide covers a pragmatic production-style deployment for ASEP / SkillSwap+:

- Backend API on Render.
- Frontend Vite SPA on Vercel.
- MongoDB Atlas for transaction-capable storage.
- GitHub Actions for tests and build checks.

## Production Topology

```text
Browser
  -> Vercel frontend
  -> Render backend API
  -> MongoDB Atlas replica set
```

The frontend may call the backend either through same-origin proxying in local Docker or through `VITE_API_URL` in hosted deployments.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas project.
2. Create an M0 or larger cluster.
3. Create a database user with read/write access.
4. Add network access for your backend host. For initial Render deployment, allow Render outbound access according to your Render networking setup. For quick portfolio demos, `0.0.0.0/0` works but is less restrictive.
5. Copy the connection string.
6. Use a database name such as `skillswap`.

Example:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillswap?retryWrites=true&w=majority&appName=ASEP
```

Atlas clusters support MongoDB transactions. Do not deploy escrow workflows on standalone MongoDB.

## Backend Deployment: Render

Create a Render Web Service:

- Root directory: `server`
- Runtime: Node
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`

Required environment variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillswap?retryWrites=true&w=majority&appName=ASEP
REQUIRE_TRANSACTION_DB=true
JWT_SECRET=<unique-32-plus-character-secret>
JWT_REFRESH_SECRET=<different-unique-32-plus-character-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DEFAULT_CREDITS=10
CLIENT_URL=https://<your-vercel-project>.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
UPLOAD_DIR=/tmp/uploads
UPLOAD_MAX_BYTES=2097152
JSON_LIMIT=25kb
GOOGLE_CLIENT_ID=
JITSI_BASE_URL=https://meet.jit.si
JITSI_ROOM_PREFIX=skillswap
```

Notes:

- Render usually provides `PORT`; setting it explicitly is fine but not required.
- Use `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true` when frontend and backend are on different HTTPS domains.
- Render ephemeral storage is not a durable upload solution. For portfolio demos it can work; for production, move profile images to object storage.
- Add every frontend origin to `CLIENT_URL` as a comma-separated list if you use previews or custom domains.

## Frontend Deployment: Vercel

Create a Vercel project from the repository:

- Root directory: `app`
- Framework preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:

```env
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

If `VITE_API_URL` is omitted, the frontend uses same-origin `/api`, which is ideal for local Docker but not for a separate Vercel + Render deployment.

After Vercel deploys, add the Vercel production URL to the backend `CLIENT_URL`.

## CORS Production Setup

`CLIENT_URL` controls allowed browser origins. Use exact origins:

```env
CLIENT_URL=https://skillswap-plus.vercel.app,https://www.yourcustomdomain.com
```

Avoid:

```env
CLIENT_URL=*
```

Production startup rejects unsafe wildcard behavior. CORS errors usually mean the frontend origin differs from `CLIENT_URL` by scheme, domain, or port.

## Docker Production Usage

The provided Compose file is best for local production-style validation and demos:

```bash
cp .env.docker.example .env.docker
docker compose up --build
```

It starts:

- `mongo`: MongoDB 7 in replica set mode.
- `mongo-init`: one-shot replica set initializer.
- `server`: Express API.
- `app`: Vite build served by nginx.

For real production, prefer managed MongoDB Atlas and platform-native services. If you do run Compose on a VPS:

- Replace all secrets in `.env.docker`.
- Put a reverse proxy with HTTPS in front of the app/API.
- Persist MongoDB and uploads volumes.
- Back up MongoDB regularly.
- Keep `REQUIRE_TRANSACTION_DB=true`.

## CI/CD Deployment Flow

Current CI checks:

1. Install backend dependencies.
2. Initialize MongoDB service as replica set.
3. Run `npm test`.
4. Verify backend startup health.
5. Build frontend.
6. Build backend and frontend Docker images.

Recommended deployment gate:

1. Pull request into `main`.
2. CI passes.
3. Manual QA checklist completed.
4. Docker Compose validation completed.
5. Merge `backend` into `main`.
6. Render and Vercel auto-deploy from `main`.

## Common Pitfalls

| Pitfall | Symptom | Fix |
| --- | --- | --- |
| Standalone MongoDB URI | Startup error about transaction topology | Use Atlas or a replica set URI |
| Missing `CLIENT_URL` | Browser CORS failure | Add exact Vercel origin |
| Wrong cookie flags | Refresh/login state fails across domains | Use `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` |
| `VITE_API_URL` missing on Vercel | Frontend calls Vercel `/api` and gets 404 | Set `VITE_API_URL=https://render-service/api` |
| Weak production secrets | Backend refuses startup | Use unique 32+ character secrets |
| Ephemeral uploads | Avatars disappear after redeploy | Use persistent storage or object storage |

## Rollback Considerations

- Keep the previous Render deploy available for rollback.
- Vercel supports instant rollback to previous deployments.
- Avoid manual database edits during rollout.
- If a booking or escrow defect is found, disable new bookings at the UI or route layer before patching data.
- Credit ledger corrections should be additive and auditable; avoid deleting transaction history.

## Deployment Readiness Checklist

- [ ] `npm test` passes against a transaction-capable database.
- [ ] `npm run build` passes in `app`.
- [ ] `docker compose up --build` starts all services.
- [ ] `CLIENT_URL` includes the deployed frontend origin.
- [ ] `VITE_API_URL` points to the deployed backend API.
- [ ] `MONGODB_URI` is Atlas or replica set.
- [ ] `REQUIRE_TRANSACTION_DB=true`.
- [ ] JWT secrets are unique and 32+ characters.
- [ ] Cookie settings match frontend/backend domain setup.
- [ ] Manual booking escrow flow has been tested after deployment.
