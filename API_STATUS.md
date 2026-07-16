# Prism PM API Status

## Current State (as of latest code changes)

### ✅ DB Initialized
All 13 tables deployed to Turso via `src/db/init.ts` (HTTP API pipeline)

### ✅ API Routes Fixed
- `serve.ts` already imports `handleApiRequest` from `src/api-handler.ts` and routes `/api/*` paths before the TanStack SSR fallthrough
- `src/lib/db.ts` rewritten to use Turso HTTP API directly (no sync library)
- `src/lib/turso-http.ts` provides HTTP-based db helpers
- `src/api-handler.ts` has complete CRUD for projects, schedule, budget
- Bug fix: `pathToRegex()` now handles `:id` syntax (was only handling `$param`)

### Endpoints
| Method | Path | Status |
|--------|------|--------|
| GET | /api/health | ✅ 200 |
| GET | /api/projects | ✅ 200 |
| POST | /api/projects | ✅ 201 |
| GET | /api/projects/:id | ✅ 200 |
| PATCH | /api/projects/:id | ✅ 200 |
| DELETE | /api/projects/:id | ✅ 200 |
| GET | /api/projects/:id/schedule | ✅ 200 |
| POST | /api/projects/:id/schedule | ✅ 201 |
| GET | /api/projects/:id/budget | ✅ 200 |
| POST | /api/projects/:id/budget | ✅ 201 |

### To Deploy
Run: `cd /home/team/shared/site && bun run publish`
