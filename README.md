# Internal Checklist MVP

Operational checklist MVP for one pilot store: **Regent Street**.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Local JSON persistence in development (`data/checklist.json`)
- Vercel Blob persistence in production when `BLOB_READ_WRITE_TOKEN` is available

## What works

- Daily checklist: `/checklist/today`
  - Filter by pending/completed/late/missed
  - Submit task with team member name + optional notes
- Weekly view: `/checklist/week`
- Reports: `/reports`
  - `total_tasks`, `compliance`, `late_rate`, `missed_rate`
- Templates CRUD: `/admin/templates`
- Generate future instances: `POST /api/admin/generate?days=14`
- Reconcile missed: `POST /api/admin/reconcile`

## SLA rules

- On completion:
  - `completed_at = now()`
  - `completed_on_time` if `completed_at <= scheduled_at + tolerance_minutes`
  - `completed_late` otherwise
- Reconcile rule:
  - `pending -> missed` when `now() > scheduled_at + 2 hours`

## Initial seed

First run creates `data/checklist.json` with:

- Store: `Regent Street`
- Default templates (7 initial tasks)

You can add/edit templates via `/admin/templates`.

## Run local

```bash
pnpm install
pnpm dev
```

If you do not use pnpm:

```bash
npm install
npm run dev
```

## Deploy on Vercel

This app now supports persistent checklist storage on Vercel through Blob.

Required setup:

1. Create a Vercel Blob store for the project.
2. Expose `BLOB_READ_WRITE_TOKEN` to the deployment environment.
3. Copy the values into the Vercel project's Environment Variables settings.

Optional env vars:

- `CHECKLIST_BLOB_PATHNAME`
  - Defaults to `checklist/db.json`
- `LOCAL_DB_PATH`
  - Only used for local development fallback

Example env file:

```bash
cp .env.example .env.local
```

Behavior:

- Local development without `BLOB_READ_WRITE_TOKEN`: reads and writes `data/checklist.json`
- Vercel with `BLOB_READ_WRITE_TOKEN`: reads and writes the checklist database in Blob storage
- Vercel without `BLOB_READ_WRITE_TOKEN`: falls back to `/tmp/checklist.json`, which works but is not persistent
