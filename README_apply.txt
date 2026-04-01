This tiny patch fixes the Vercel TypeScript build error in src/lib/verifiedGames.ts.

What changed:
- Replaced the Rule Lock label Map lookup with a simple getLabel(id: string) helper.
- This avoids the narrow-literal Map key type issue that caused:
  Argument of type 'string' is not assignable to parameter of type ...

Apply by replacing:
- src/lib/verifiedGames.ts

Then commit and redeploy.
