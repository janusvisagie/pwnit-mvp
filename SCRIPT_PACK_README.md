# Developer-only DB switch and reset pack

## What this pack does
- `use-live-db.ps1` backs up `.env` and `.env.local`, then switches both to your live DB automatically.
- `use-local-db.ps1` backs up `.env` and `.env.local`, then switches both to your local DB automatically.
- `check-item-states.mjs` prints item states from whichever DB your env files currently point to.
- `reopen-all-items.mjs` reopens all items only.
- `full-reset-items.mjs` reopens all items and clears item-linked history.

## One-time setup
1. Copy `scripts/db-targets.example.json` to `scripts/db-targets.json`.
2. Put your real local and live database URLs into `scripts/db-targets.json`.
3. Do **not** commit `scripts/db-targets.json` if it contains live credentials.

## Typical future workflow
### Reopen items on the live site
1. `powershell -ExecutionPolicy Bypass -File scripts/use-live-db.ps1`
2. `node scripts/check-item-states.mjs`
3. `node scripts/reopen-all-items.mjs`
4. Refresh the live site.
5. `powershell -ExecutionPolicy Bypass -File scripts/use-local-db.ps1`

### Full destructive reset on the live site
1. `powershell -ExecutionPolicy Bypass -File scripts/use-live-db.ps1`
2. `node scripts/full-reset-items.mjs`
3. Read the dry-run summary.
4. `node scripts/full-reset-items.mjs --execute --allow-purchases`
5. Refresh the live site.
6. `powershell -ExecutionPolicy Bypass -File scripts/use-local-db.ps1`

## Yes: backups are automatic
Both PowerShell switch scripts automatically back up your current `.env` and `.env.local` into `tmp/env-switch-backups` before changing anything.
