# Architecture Documentation

ASEP / SkillSwap+ is intentionally built as a straightforward full-stack JavaScript application:

- Vite SPA frontend.
- Express backend.
- MongoDB with Mongoose.
- MongoDB transactions for credit escrow.
- Docker Compose for local production-style validation.
- GitHub Actions for CI.

## Frontend Architecture

```text
app/
  src/main.js              App bootstrap, global search, notifications
  src/router.js            Hash-based SPA routing
  src/state.js             Local state store
  src/pages/               Route-level pages
  src/components/          Shared UI components
  src/services/            API client wrappers
  src/styles/              Global styles
```

The frontend is a Vite single-page app using vanilla JavaScript modules. It avoids framework migration and keeps routing hash-based for simple static hosting.

API calls go through `app/src/services/api.js`, which:

- Adds bearer tokens.
- Sends refresh cookies with `credentials: include`.
- Attempts token refresh on protected 401 responses.
- Returns safe structured errors for network failures.
- Supports optional `VITE_API_URL` for hosted frontend/backend split deployments.

## Backend Architecture

```text
server/src/
  app.js                   Express app and middleware composition
  server.js                Process entry point and DB startup
  config/                  Env parsing, DB connection, mongoose guards
  middleware/              Auth, security, validation, rate limiting, errors
  models/                  Mongoose schemas
  routes/                  Express routers
  controllers/             HTTP orchestration
  services/                Business logic and transactions
  validators/              Joi schemas
  utils/                   Shared helpers
```

Controllers stay thin where possible. Business-critical workflows such as booking escrow live in services.

## Authentication Flow

1. User registers or logs in.
2. Backend creates an access token and refresh token.
3. Refresh token is hashed before being stored on the user record.
4. Refresh token is set as a cookie.
5. Frontend stores the access token and uses it in the `Authorization` header.
6. Protected backend middleware validates the access token and loads the user.
7. If a protected request gets 401, the frontend attempts `/auth/refresh`.
8. Logout clears the stored refresh token and cookie.

Security controls:

- Password hashing with bcrypt.
- Strong secret checks in production.
- Refresh-token rotation.
- Safe errors outside development.
- Rate limiting on API and auth routes.

## Booking Escrow Lifecycle

```text
open session
  -> learner creates booking
  -> credits reserved in escrow
  -> mentor accepts
  -> Jitsi link generated
  -> mentor completes
  -> credits released to mentor
  -> learner can review
```

Cancellation/rejection path:

```text
pending or accepted booking
  -> cancel/reject
  -> reserved credits refunded to learner
```

The booking service uses MongoDB sessions and transactions around writes that must be atomic:

- Booking creation.
- Credit reservation.
- Ledger entry creation.
- Escrow release.
- Escrow refund.
- Status transitions.
- Participant updates.

## Transaction System

MongoDB transactions require Atlas, replica set, or mongos. Startup checks enforce this when `REQUIRE_TRANSACTION_DB=true`.

Important credit safeguards:

- `$gte` guard prevents negative balances during reservation/transfer.
- Ledger entries reference related sessions, users, and bookings.
- Booking status transitions check current state.
- Unique active booking index prevents duplicate pending/accepted bookings per learner/session.
- Idempotent paths reduce duplicate release/refund risk.

## Search Architecture

Global search is implemented in `server/src/services/search.service.js`.

It searches:

- Open/full/in-progress sessions by title, category, and tags.
- Mentors by name, offered skills, and wanted skills.
- Skills from configured categories and persisted session/user skills.

Search input is normalized, length-limited, and regex-escaped before querying.

## Notification Architecture

Notifications are persisted in MongoDB and scoped to a user.

Notification routes support:

- Pagination.
- Unread count.
- Mark one as read.
- Mark all as read.
- Auth protection and ownership enforcement.

Booking, review, auth, and credit workflows create notifications through `notification.service.js`.

## Docker Architecture

```text
docker compose
  mongo       MongoDB 7 in replica set mode
  mongo-init  One-shot replica set initializer
  server      Express API container
  app         Vite build served by nginx
```

The app container proxies `/api` and `/uploads` to the server container for a simple same-origin local demo.

## CI/CD Workflow

GitHub Actions runs three checks:

- Backend check: install, initialize MongoDB replica set, run tests, verify server startup.
- Frontend check: install and build Vite app.
- Docker check: build backend and frontend images.

CI does not deploy by itself. Render and Vercel can be configured to auto-deploy from `main` after CI passes.

## Known Architectural Boundaries

- The frontend is intentionally framework-light and not migrated to React/Vue/Svelte.
- Uploads are local filesystem based; production should use durable object storage.
- Mentor application, assignment, and referral pages are currently frontend/demo workflows, not dedicated persisted backend APIs.
- There is no admin dashboard yet for moderation or mentor approval.
- End-to-end browser automation is not included yet.
