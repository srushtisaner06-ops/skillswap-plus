# Environment Configuration

ASEP / SkillSwap+ uses separate environment files for local backend development, Docker Compose, and optional frontend deployment configuration.

## Files

| File | Purpose | Committed |
| --- | --- | --- |
| `server/.env.example` | Backend local template | Yes |
| `server/.env` | Backend local secrets | No |
| `.env.docker.example` | Docker Compose template | Yes |
| `.env.docker` | Docker Compose secrets | No |
| `app/.env.example` | Frontend deployment template | Yes |
| `app/.env.local` | Optional local frontend override | No |

## Backend Variables

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | `development` | Use `production` on deployed services. |
| `PORT` | Yes | `5000` | Render may inject this automatically. |
| `MONGODB_URI` | Yes | `mongodb+srv://.../skillswap` | Must support transactions. |
| `REQUIRE_TRANSACTION_DB` | Yes | `true` | Keep enabled so escrow never runs on standalone MongoDB. |
| `DB_CONNECT_RETRIES` | No | `3` | Startup retry count. |
| `DB_CONNECT_RETRY_DELAY_MS` | No | `1500` | Delay between connection retries. |
| `JWT_SECRET` | Yes | generated secret | Access-token signing secret. Use 32+ chars in production. |
| `JWT_REFRESH_SECRET` | Yes | generated secret | Refresh-token signing secret. Use a different 32+ char value. |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifetime. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime and cookie max age source. |
| `COOKIE_SECURE` | Production | `true` | Required for cross-site HTTPS refresh cookies. |
| `COOKIE_SAMESITE` | Production | `none` | Use `lax` for same-site local dev, `none` for Vercel + Render. |
| `DEFAULT_CREDITS` | No | `10` | New-user starting balance. |
| `UPLOAD_DIR` | No | `./uploads` | Use persistent storage in production. |
| `UPLOAD_MAX_BYTES` | No | `2097152` | Profile image upload limit. |
| `JSON_LIMIT` | No | `25kb` | Express JSON body size limit. |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Comma-separated CORS origins. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | Leave blank to disable Google login verification. |
| `JITSI_BASE_URL` | No | `https://meet.jit.si` | Meeting URL base. |
| `JITSI_ROOM_PREFIX` | No | `skillswap` | Prefix for generated meeting rooms. |

## Frontend Variables

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | Hosted frontend only | `https://api.example.com/api` | Optional. Defaults to `/api`. |

Local Vite development usually does not need `VITE_API_URL` because `app/vite.config.js` proxies `/api` to `http://localhost:5000`.

Docker also does not need it because nginx proxies `/api` to the backend service.

Vercel usually does need it when the backend is on Render:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

## Secret Generation

Use any password manager or secure random generator. Examples:

```bash
openssl rand -base64 48
```

PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Use different values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

## Transaction Requirements

Escrow and credit consistency depend on MongoDB transactions. Valid deployments:

- MongoDB Atlas M0+.
- Self-hosted MongoDB replica set.
- MongoDB through mongos.

Invalid deployment:

- Standalone MongoDB without replica set.

Keep:

```env
REQUIRE_TRANSACTION_DB=true
```

Only set it to `false` for temporary diagnostics where booking and escrow flows are not being exercised.

## Example Local Backend `.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skillswap?replicaSet=rs0
REQUIRE_TRANSACTION_DB=true
JWT_SECRET=local-access-secret-change-this-to-32-plus-chars
JWT_REFRESH_SECRET=local-refresh-secret-change-this-too-32-plus-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
DEFAULT_CREDITS=10
UPLOAD_DIR=./uploads
CLIENT_URL=http://localhost:5173
JITSI_BASE_URL=https://meet.jit.si
JITSI_ROOM_PREFIX=skillswap-local
```

## Example Production Backend Env

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillswap?retryWrites=true&w=majority&appName=ASEP
REQUIRE_TRANSACTION_DB=true
JWT_SECRET=<unique-32-plus-character-secret>
JWT_REFRESH_SECRET=<different-unique-32-plus-character-secret>
COOKIE_SECURE=true
COOKIE_SAMESITE=none
CLIENT_URL=https://your-app.vercel.app
```
