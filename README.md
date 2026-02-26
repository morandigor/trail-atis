# Internal Checklist MVP (Local Mode)

Operational checklist MVP for one pilot store: **Regent Street**.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Local JSON persistence (`data/checklist.json`)

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
