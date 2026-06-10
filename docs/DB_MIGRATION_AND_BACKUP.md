# PwnIt 2 — Database backup, migration & restore

This project uses **PostgreSQL** (`DATABASE_URL`). PwnIt 2 runs on a **separate** database
from PwnIt 1 — only ever back up / migrate the **pwnit-2** database here. Never point these
commands at the live PwnIt 1 database.

## Backups

```
npm run db:backup            # dumps the DB in DATABASE_URL  -> backups/pwnit-db-backup-<timestamp>.sql
npm run db:backup:prod       # dumps the DB in PROD_DATABASE_URL
node scripts/backup-db.mjs --dump   # custom-format (.dump) instead of plain .sql
```

- Output goes to `./backups/` (gitignored — see "Gitignore" below). Backups are **never committed**.
- The script prints only the host + database name, **never** the password.
- If `pg_dump` is not on PATH, set `PG_DUMP_PATH` to its full path (Windows example):
  `$env:PG_DUMP_PATH="C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"`
- Use a `pg_dump` whose major version is >= the server's.

### Backing up production safely (PowerShell)
```
$env:PROD_DATABASE_URL="postgresql://USER:***@HOST:5432/pwnit2_prod"
npm run db:backup:prod
# confirm the printed file exists and has a sensible size before continuing
```
Do not paste a production URL into any committed file (keep it in `.env.local` or the shell only).

## Gitignore

There is no root `.gitignore` shipped in this patch (so it can't clobber yours). The `backups/`
folder is self-ignoring via `backups/.gitignore`. For belt-and-suspenders, add these lines to your
root `.gitignore` if not already present:

```
backups/
tmp/backups/
*.sql
*.dump
```
Do **not** ignore Prisma schema/migration files (`prisma/schema.prisma`, `prisma/migrations/**`).

## Before ANY production migration

1. **Back up:** `npm run db:backup:prod` (or `db:backup` against the target DB).
2. **Confirm** the backup file exists and looks complete (non-trivial size).
3. **Run the migration** (see below).
4. **Verify the app** (sign in, view a campaign, play, buy — the PwnIt 2 happy path).
5. **Keep the backup** somewhere safe until you've confirmed the deploy is healthy.

## Running a migration

This repo currently ships schema with `prisma db push` (no migration history). For the
structural changes proposed in `PROPOSED_SCHEMA_CHANGES.md`, prefer **versioned migrations**:

```
# 1) back up first (above)
# 2) create + apply a migration from schema.prisma changes:
npx prisma migrate dev --name add_lifecycle_ledgers_admin   # local/dev DB
# 3) for the deployed pwnit-2 DB:
npx prisma migrate deploy
```

If you stay on `prisma db push`, run `npm run db:push` against the **pwnit-2** DB only, after a
backup. `migrate` is recommended here because these changes add tables/columns you'll want a
revertible history for.

All proposed changes are **additive** (new nullable columns + new tables), so existing rows and
the current PwnIt 2 flow keep working.

## Restoring a backup (into a local/staging DB for testing)

Plain `.sql` backup:
```
# point at a SCRATCH database (never production)
$env:RESTORE_URL="postgresql://USER:***@localhost:5432/pwnit2_staging"
psql "$env:RESTORE_URL" -f backups/pwnit-db-backup-YYYY-MM-DD-HH-mm-ss.sql
```

Custom-format `.dump` backup:
```
pg_restore --clean --no-owner --no-privileges --dbname="$env:RESTORE_URL" backups/pwnit-db-backup-...dump
```

Then set the app's `DATABASE_URL` to the staging DB and run `npm run dev` to validate against the
restored data. Never restore over the production database.
