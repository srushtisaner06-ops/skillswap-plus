# ASEP Docker Setup

This setup runs the production-style frontend, backend, and a local MongoDB replica set. The replica set matters because booking escrow uses MongoDB transactions.

## Prerequisites

- Docker Desktop or Docker Engine with Compose v2
- No local services already using ports `8080`, `5000`, or `27017`

## First Run

1. Copy the Docker env template:

```bash
cp .env.docker.example .env.docker
```

2. Replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with unique values of at least 32 characters.

3. Build and start the stack:

```bash
docker compose up --build
```

4. Open the app:

```text
http://localhost:8080
```

The API is also exposed at:

```text
http://localhost:5000/api/health
```

## Services

- `app`: static Vite build served by unprivileged nginx on port `8080`
- `server`: Express API running as a non-root user on port `5000`
- `mongo`: MongoDB 7 with replica set mode enabled
- `mongo-init`: one-shot replica set initializer

## Common Commands

Start in the foreground:

```bash
docker compose up --build
```

Start in the background:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f server
```

Stop containers:

```bash
docker compose down
```

Stop and remove local data volumes:

```bash
docker compose down -v
```

## Production Notes

- Do not use `.env.docker.example` values in production.
- Use managed MongoDB Atlas or another replica-set/mongos deployment for production.
- CORS allows the local Docker frontend at `http://localhost:8080`, local Vite at `http://localhost:5173`, the known Vercel frontend origins, and any origin added through `CLIENT_URL`.
- Set `CLIENT_URL` to the deployed frontend origin when the API is deployed separately. Comma-separated values are supported.
- Keep uploads on persistent storage. The compose setup uses the `uploads-data` volume locally.
- The frontend container proxies `/api` and `/uploads` to the backend service for simple single-origin local demos.

## Rollback Safety

Dockerization does not change application data schemas or booking logic. If the Docker stack fails, the existing Node/Vite local workflow still works:

```bash
cd server && npm run dev
cd app && npm run dev
```
