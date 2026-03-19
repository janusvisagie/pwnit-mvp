PwnIt combined patch: password auth + nav cleanup + gamification/social sharing/terms

Included from the prior combined auth patch:
- Guest-first optional email + password auth
- Localhost demo-user switching retained
- Admin hidden from live nav
- Dashboard only shown for real signed-in users
- Simplified welcome modal

New in this bundle:
- Dashboard/profile page with:
  - games played
  - best rank
  - total winnings
  - streak
  - achievements
  - badges
  - share / challenge panel
- Broad social sharing support:
  - native share sheet where available
  - WhatsApp, Facebook, X, Telegram, Email quick links
  - copy caption for TikTok / Instagram
- Public Terms & Conditions page
- Updated How it works page with softer legal wording and referral / feedback references
- Header nav updated to include Terms

Files added or changed beyond the previous auth patch:
- src/app/dashboard/page.tsx
- src/app/terms/page.tsx
- src/app/how-activation-works/page.tsx
- src/components/ProfileSharePanel.tsx
- src/components/HeaderNav.tsx
- src/lib/gamification.ts

Notes:
1. The dashboard stats are derived from existing Attempt / Winner / Referral / SurveyResponse data.
2. The dashboard redirects guests and localhost demo users to /login.
3. Instagram and TikTok do not provide a simple browser share intent like WhatsApp/X/Facebook, so this patch uses:
   - the native share sheet where available
   - a copy button for those platforms
4. These Terms & Conditions are MVP starter content and should still be refined with formal legal review.
