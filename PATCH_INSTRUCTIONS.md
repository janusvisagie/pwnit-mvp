Apply by unzipping into your repo root and overwriting the matching files.

What this patch does:
- hides the demo-user switcher in production
- keeps it visible in local/dev
- blocks POST /api/demo/switch in production

Optional override:
- set ENABLE_DEMO_SWITCHER=true (or NEXT_PUBLIC_ENABLE_DEMO_SWITCHER=true)
  if you ever want to re-enable the switcher outside local/dev.
