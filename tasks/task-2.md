# Task 2: Set Up Express + Prisma + SQLite

**Status:** Complete

## What Was Done
Set up the Express server with Prisma ORM connected to SQLite. Created the health endpoint and verified database connectivity.

## Files Created
- `backend/src/index.ts` — Express server with CORS, JSON parsing, health endpoint
- `backend/prisma/schema.prisma` — SQLite datasource, Run + Document models
- `backend/.env` — DATABASE_URL="file:./dev.db" and other config

## Key Decisions
- SQLite chosen for zero-install hackathon use
- Prisma auto-creates dev.db on first run
- Health endpoint pings DB with `SELECT 1`

## Verification
- `npx prisma db push` created dev.db
- Prisma client generated successfully
- Server starts on port 3001
- `PrismaClient` connects and returns 0 runs
