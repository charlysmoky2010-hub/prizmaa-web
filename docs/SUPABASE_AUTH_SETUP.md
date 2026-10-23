# PRIZMAA — Supabase Auth and protected member routes

## Project
- Supabase: prizmaa-founder-private (iyxmfiyvikrbfrscsaja), EU Central.
- The landing page and /prizmaa/app cultural directory stay public.
- /login is invite-only email/password sign-in.
- /members and /api/member/* require verified Supabase Auth user plus a public.prizmaa_private_members record with membership_state=active, adult_review_state=verified and member_role=founder/tester.
- Identity is checked at Supabase Auth /auth/v1/user. Membership is checked using the user JWT and RLS, not a service key.
- Sessions use HttpOnly cookies; Secure in production; SameSite=Lax.
- Next.js 16 proxy.ts refreshes sessions, denies unauthenticated users, and page/API routes revalidate independently.

## Runtime configuration
Set in .env.local for local work and in the CORRECT Vercel project environment:

    SUPABASE_URL=https://iyxmfiyvikrbfrscsaja.supabase.co
    SUPABASE_PUBLISHABLE_KEY=<enabled sb_publishable_... key from Supabase Connect>

Only use a publishable key. Never use a service-role or secret key in public code.
Do not commit .env.local.

## Invite-only provisioning
No general self-registration route is exposed. New Supabase Auth accounts are NOT auto-approved.
1. Administrator securely provisions a user from the Supabase Auth dashboard and arranges secure password setup and email verification.
2. Administrator completes a real 18+ review separately.
3. Administrator inserts or updates the existing auth.users.id in public.prizmaa_private_members using the privileged dashboard, with membership_state='active' and adult_review_state='verified'.
4. To deny access, set membership_state='suspended'. The live membership state is rechecked each request.

At implementation time, Supabase showed ZERO Auth accounts and ZERO private members. This change does not create users.

## Verification checklist
- [ ] Anonymous GET /members redirects to /login.
- [ ] Anonymous GET /api/member/me returns 401.
- [ ] Cross-site POST /api/auth/login returns 403.
- [ ] Wrong credentials/unapproved status fail with generic message.
- [ ] Approved member can sign in.
- [ ] Suspended and unverified accounts cannot enter even with active JWT.
- [ ] Expired session refreshes cookies.
- [ ] Logout clears cookies and remote logout result is inspected.
- [ ] Run Supabase security advisors and two-user cross-account RLS tests.
- [ ] Verify Vercel preview build and test before merging main.

## Scope boundaries
This is an invite-only authentication gate. Public signup, password reset, invitation email flow, admin moderation, and GDPR/age identity verification service are not implemented. Existing standalone SQLite prototype is not migrated and must not be assumed to use Supabase.

Do not grant adult verification from browser input. Supabase Auth email/site URL configuration and independent safety/privacy checks must be reviewed before public onboarding.
