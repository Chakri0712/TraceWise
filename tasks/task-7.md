# Task 7: Build File Upload Endpoint + Parsers

**Status:** Complete

## What Was Done
Created the POST /api/upload endpoint with multer for file handling and parsers for .md, .pdf, .txt, .docx formats. Files are parsed, stored in SQLite, and temp files cleaned up.

## Files Created
- `backend/src/routes/upload.ts` — Upload route with multer config
- `backend/src/parsers/index.ts` — File parser dispatcher

## Supported Formats
| Format | Extension | Parser |
|--------|-----------|--------|
| Markdown | .md | fs.readFileSync |
| Plain Text | .txt | fs.readFileSync |
| PDF | .pdf | pdf-parse library |
| Word | .docx | mammoth library |

## Key Decisions
- Max 10 files per upload, 10MB each
- Multer filters unsupported extensions before processing
- Temp files deleted immediately after parsing
- Creates a new Run record for each upload batch

## Verification
- `POST /api/upload` returns `{ runId, status, documents[] }`
- Documents stored in SQLite with full content
