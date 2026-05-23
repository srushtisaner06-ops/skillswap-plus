# ASEP / SkillSwap+

ASEP, branded in the app as SkillSwap+, is a peer-to-peer skill exchange platform where people teach skills to earn credits and spend credits to learn from others. The project combines a Vite single-page app, an Express API, MongoDB transactions, booking escrow, Jitsi meeting links, reviews, global search, notifications, Dockerized local infrastructure, and CI-ready integration tests.

The core product idea is simple: remove money from the first learning interaction while still making every session accountable. Learner credits are reserved in escrow when a booking is requested, released to the mentor only after completion, and refunded on cancellation or rejection.

## Feature Highlights

- Account registration, login, logout, refresh tokens, protected routes, and Google OAuth support.
- Session marketplace with mentor-hosted skill sessions.
- Transaction-safe booking lifecycle: request, reserve credits, accept, generate Jitsi link, complete, release escrow.
- Reviews allowed only after a completed learner booking.
- Credit ledger with spend, earn, bonus, and refund transaction records.
- Notification center with unread counts, pagination, single read, and read-all behavior.
- Global search across sessions, mentors, and skills with input sanitization.
- Community posts, comments, voting, and accepted-solution flow.
- Profile, projects, resumes, recommendations, activity, and profile-completion modules.
- Responsive Vite SPA with graceful network handling and duplicate-submit protection.
- Docker Compose stack with MongoDB replica set initialization.
- GitHub Actions pipeline for backend tests, frontend build, and Docker image checks.

## Screenshots

Add production screenshots or GIFs before portfolio publishing:

| Area | Screenshot |
| --- | --- |
| Landing and auth | `docs/screenshots/landing.png` |
| Marketplace booking | `docs/screenshots/marketplace.png` |
| Dashboard lifecycle | `docs/screenshots/dashboard.png` |
| Notification center | `docs/screenshots/notifications.png` |
| Mobile layout | `docs/screenshots/mobile.png` |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite SPA, vanilla JavaScript modules, CSS/Tailwind-style utility classes |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas or MongoDB replica set |
| Auth | JWT access tokens, refresh-token cookies, bcrypt password hashing |
| Validation | Joi, Mongoose validators |
| Security | Helmet, CORS allowlist, rate limiting, request sanitization, safe JSON errors |
| Testing | Jest, Supertest |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Meetings | Jitsi link generation |

## Architecture Overview

```text
app/                       Vite SPA
  src/pages/               Route-level screens
  src/services/            API client wrappers
  src/components/          Shared UI components

server/                    Express API
  src/routes/              HTTP route definitions
  src/controllers/         Request/response orchestration
  src/services/            Business logic and transaction workflows
  src/models/              Mongoose schemas and indexes
  src/validators/          Joi validation schemas
  src/middleware/          Auth, validation, security, rate limiting, errors

MongoDB                    Replica set or Atlas deployment required for transactions
```

More detail lives in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Local Development

Prerequisites:

- Node.js 18+
- npm
- MongoDB Atlas M0+ or a local MongoDB replica set

Install dependencies:

```bash
cd server
npm install

cd ../app
npm install
```

Configure backend environment:

```bash
cd server
cp .env.example .env
```

Set at least:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/skillswap?replicaSet=rs0
JWT_SECRET=replace-with-a-unique-32-plus-character-secret
JWT_REFRESH_SECRET=replace-with-a-different-32-plus-character-secret
CLIENT_URL=http://localhost:5173
```

Run the backend:

```bash
cd server
npm run dev
```

Run the frontend:

```bash
cd app
npm run dev
```

Open `http://localhost:5173`.

## Docker Setup

Docker is the easiest way to run the complete local stack because it starts MongoDB in replica set mode.

```bash
cp .env.docker.example .env.docker
# edit JWT_SECRET and JWT_REFRESH_SECRET
docker compose up --build
```

Open:

- Frontend: `http://localhost:8080`
- API health: `http://localhost:5000/api/health`

See [DOCKER.md](DOCKER.md) for service details and troubleshooting.

## Environment Variables

The backend reads `server/.env`. Docker Compose reads `.env.docker`. The frontend defaults to same-origin `/api`, with optional `VITE_API_URL` support for separately hosted deployments.

Key variables:

- `MONGODB_URI`: must point to Atlas, mongos, or a replica set.
- `REQUIRE_TRANSACTION_DB`: keep `true` outside temporary diagnostics.
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: unique 32+ character secrets in production.
- `CLIENT_URL`: comma-separated allowed frontend origins for CORS.
- `COOKIE_SECURE` and `COOKIE_SAMESITE`: production cookie controls.
- `VITE_API_URL`: optional frontend API base URL, for example `https://api.example.com/api`.

Full reference: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## MongoDB Replica Set Requirement

Booking escrow depends on MongoDB multi-document transactions. Transactions require MongoDB Atlas, a replica set, or mongos. A standalone local MongoDB instance is intentionally rejected when `REQUIRE_TRANSACTION_DB=true`.

Local replica set example:

```bash
mongod --dbpath ./data/asep-rs0 --replSet rs0 --bind_ip localhost --port 27017
```

Then initialize once in `mongosh`:

```javascript
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "127.0.0.1:27017" }]
})
```

## Booking Escrow Flow

1. Learner requests a session.
2. Backend starts a MongoDB transaction.
3. Booking is created as `pending`.
4. Learner credits are deducted and recorded as a `spend` ledger entry.
5. Mentor accepts and a Jitsi URL is attached.
6. Mentor completes the booking.
7. Escrow is released to the mentor as an `earn` transaction.
8. If cancelled or rejected before completion, reserved credits are refunded.

The lifecycle is protected with status checks, unique active-booking indexes, `$gte` balance guards, and idempotent handling for repeated terminal actions.

## API Overview

The API is mounted under `/api`.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/sessions`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/accept`
- `PATCH /api/bookings/:id/complete`
- `POST /api/reviews`
- `GET /api/search?q=react`
- `GET /api/notifications`

See [docs/API.md](docs/API.md) for request and response examples.

## Testing

Backend tests require a transaction-capable MongoDB URI:

```bash
cd server
npm test
```

Frontend production build:

```bash
cd app
npm run build
```

The current Jest suite covers auth, booking lifecycle, escrow rollback assumptions, validation/security behavior, search, and notifications.

## CI/CD

GitHub Actions runs:

- Backend install and Jest tests against a MongoDB service initialized as a replica set.
- Backend startup health check.
- Frontend production build.
- Backend and frontend Docker image builds.

The workflow is in [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Deployment

Recommended portfolio deployment:

- Backend: Render Web Service.
- Frontend: Vercel static Vite deployment.
- Database: MongoDB Atlas M0+ or higher.

Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before deploying. The most common production issue is using a standalone MongoDB URI, which breaks escrow transactions.

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `MongoDB is running as a standalone server` | URI does not point to a replica set or Atlas | Use Atlas or add `?replicaSet=rs0` to a real replica set URI |
| CORS errors in browser | `CLIENT_URL` missing deployed frontend origin | Add the exact Vercel origin to `CLIENT_URL` |
| Refresh cookies not sent | Cookie flags do not match HTTPS/domain setup | Use `COOKIE_SECURE=true` on HTTPS and review `COOKIE_SAMESITE` |
| Docker cannot start | Docker daemon not running or ports are occupied | Start Docker Desktop and free ports `8080`, `5000`, `27017` |
| Tests timeout on Mongo | Local replica set is not running | Start Docker stack or provide Atlas test URI |

## Security Considerations

- Passwords are hashed with bcrypt.
- JWT access tokens are short-lived; refresh tokens are stored as cookies and hashed server-side.
- Production requires strong JWT secrets.
- CORS is origin-based; avoid wildcards in production.
- Helmet, rate limiting, request sanitization, and Joi validation are enabled.
- File uploads are size-limited and signature-checked.
- Error responses avoid leaking stack traces outside development.

## Roadmap

- Persist mentor applications, referrals, and assignments as first-class backend resources.
- Add browser-based end-to-end tests for the critical booking and review journey.
- Add screenshots and demo video assets.
- Add admin moderation views for community and mentor approvals.
- Add hosted upload storage for production avatars.

## Contributing

1. Create a branch from `backend` or the current integration branch.
2. Keep changes scoped and preserve the existing Vite, Express, MongoDB, Docker, and CI architecture.
3. Add or update tests for backend behavior changes.
4. Run `npm test`, `npm run build`, and Docker validation where possible.
5. Document any validation that could not be run.

## License

No license file is currently included. Add a `LICENSE` file before publishing as open source.
