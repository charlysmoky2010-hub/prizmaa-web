# PRIZMAA — PRIVATE SOCIAL BETA FIX (17 October 2026)

## What is now implemented on the review branch
- `/prizmaa/beta`: responsive member UI for local registration/login, optional profile visibility, member discovery, two-way match list, matched-only messaging, blocking, reporting, privacy export and account deletion.
- Internet visitors see a non-functional development preview, not a real member platform. No fabricated members or claims of active traffic.
- `/api/prizmaa/core`: rejects all membership operations on Vercel, on public-preview settings, and without `PRIZMAA_LOCAL_MVP=1` and a loopback host.
- Removed `upgrade_vip` entitlement granting in both API and SQLite store. Without an independently verified payment webhook, paid access must stay closed.
- New CSS-only 3D-inspired hero is visual styling, not a claim of novel AI or spatial-computing capabilities.
- Public page contributor full name redacted from current source. **Historical Git commits and repository ownership remain public:** this patch does NOT remove existing internet exposures.
- Build/test workflow uses Node 24, Node SQLite integration tests, runtime policy tests, TypeScript, and Next production build.

## Local access, development only
Do not invite people or deploy. Use a local Node 24 environment:

```sh
npm ci
npm run dev:private
```

Open `http://127.0.0.1:3000/prizmaa/beta`. Test profiles use an ignored local SQLite database. Use synthetic accounts only; never import real identity or dating information in development. The local server must bind to 127.0.0.1.

## Unresolved launch blockers
1. Persistent encrypted production database and backups, not Vercel /tmp SQLite.
2. Server-backed email verification and adequate independent age assurance, not adult self-declaration.
3. Real abuse prevention and moderation workflows plus an escalation response plan.
4. Privacy/legal review for GDPR special-category data, purpose limitation, notices and retention.
5. Payment webhook with authoritative live payment checks, exact customer-to-entitlement mapping, refund/reversal and delivery tests; no paid sales until then.
6. Public code history still contains previous identifying materials; the history cannot be sanitized by editing present source alone.

## Verification principle
A green build proves tests/build only, not safety accreditation, product-market fit, real users, public readiness, or verified revenue. The draft PR must not be merged/deployed without owner approval.
