# SkillSwap+ Backend API

This directory contains the Express API for ASEP / SkillSwap+.

For full project setup, deployment, testing, and architecture documentation, start at the repository root:

- [Project README](../README.md)
- [API documentation](../docs/API.md)
- [Architecture documentation](../docs/ARCHITECTURE.md)
- [Environment reference](../docs/ENVIRONMENT.md)
- [Deployment guide](../docs/DEPLOYMENT.md)

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The backend requires MongoDB Atlas or a local MongoDB replica set when `REQUIRE_TRANSACTION_DB=true`. Booking escrow depends on MongoDB transactions and should not be run on standalone MongoDB.

## Scripts

```bash
npm start       # production start
npm run dev     # development with nodemon
npm run seed    # seed sample data
npm test        # Jest + Supertest integration tests
```

## Health Check

```text
GET /api/health
```
