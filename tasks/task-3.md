# Task 3: Create Prisma Schema for Runs

**Status:** Complete

## What Was Done
Defined the data models for analysis runs and uploaded documents in the Prisma schema. Pushed schema to SQLite.

## Files Modified
- `backend/prisma/schema.prisma` — Added Run and Document models

## Schema Models
- **Run**: id, status, coverage%, gaps (JSON string), createdAt, documents[]
- **Document**: id, filename, type, content, runId (FK to Run)

## Key Decisions
- `gaps` stored as JSON string (not a relation) for simplicity
- `matches` and `generatedTestCases` returned in API but not persisted
- Status lifecycle: pending → uploaded → analyzing → completed

## Verification
- `npx prisma db push` synced schema
- `npx prisma studio` shows empty Run and Document tables
