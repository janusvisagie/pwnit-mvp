This patch replaces the old OTP auth endpoints with harmless stubs so the app compiles after moving to email + password auth.

Replace these files:
- src/app/api/auth/request-code/route.ts
- src/app/api/auth/verify-code/route.ts

These routes are no longer used by the current login UI. They now return HTTP 410 instead of importing removed OTP helpers.
