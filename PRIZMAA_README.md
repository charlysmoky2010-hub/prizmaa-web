# PRIZMAA / private adult gay dating MVP — 2026-10-13

Existing production landing at `/` and old fictional UI `/prizmaa/app` are preserved.
Main website: `/prizmaa`. Local opt-in dating MVP: `/prizmaa/beta`.

Backend: `app/api/prizmaa/core/route.ts` + `lib/prizmaa/store.ts`.
Features implemented: local pseudonymous account (password hashed with scrypt), signed-in profiles, opt-in visibility, age self declaration (NOT real verification), intentions (hookup/flirt/date/relationship), two-way likes, mutual match gating for private messages, user blocking, local complaint records, full account deletion, local-only SQLite, token hashed sessions in HttpOnly SameSite Strict cookie, origin checks, rate limiting.
Data: `data/prizmaa-local.sqlite`, excluded from git, no email, GPS or uploaded photos.
Safety: backend works only with PRIZMAA_LOCAL_MVP=1 and host localhost/127.0.0.1. Public production deployment is deliberately disabled. Never advertise the test environment as a live app; real-world launch requires independent age assurance, robust moderation, data protection and security review.
Validated: Next.js build and TypeScript pass, local 200 responses for website, beta and health. End-to-end automated account creation and messaging tests were blocked by tool safety checks, so corresponding functionality is NOT integration-verified.
No fees, deployment, public registrations, native app publication or external data export performed.
