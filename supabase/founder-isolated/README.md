# PRIZMAA Founder Trust Core — ISOLATED / NO PUBLIC SIGNUPS

**Status:** Source-controlled deployment candidate with real PostgreSQL RLS tests. NOT activated on any hosted Supabase project. There are NO real members, NO payment product, NO profile discovery, and NO SMS/emails sent.

## Security boundary
- This folder is a **clean-room** implementation, independent of PRIZMAA's former local SQLite, generic marketing projects and historical Supabase data.
- It must only be deployed to a **new, dedicated, EU-region Supabase project** once the project organization and quoted cost are approved.
- Never migrate data from previous dating demos, placeholder profiles, agent logs or mailing lists.
- It creates only two tables: private membership and private profile. Public discovery, matching, messages, 3D design, social graph and payments are deliberately absent.
- Membership role, adult-review state and activation are controlled by trusted server credentials, not the browser or editable user metadata.
- A member can only SELECT their own membership. Only verified active members can INSERT/UPDATE their own private profile; owner-only SELECT/DELETE always applies.
- Profiles default to invisible; there is **no policy** granting other members access even when the boolean is true.
- Account deletion endpoint authenticates the caller's access token and deletes the caller (never an arbitrary user ID). Membership and profile cascade via the FK.
- No raw token, service key, JWT, email, phone number, legal name, sexual orientation, photos, address or GPS is committed to this repository.

## Mandatory one-time activation gate (NOT yet satisfied)
1. Confirm the target Supabase organization and its **quoted €0 / nonzero cost**. Do not create or upgrade paid services without user authorization.
2. Create a fresh Supabase project in the EU. Secure admin credentials and API keys in managed secret storage.
3. Configure Supabase Auth: **disable self-service sign-up**, require verified email/invitation, reject anonymous sign-ins, protect redirect URLs, keep short JWT access token TTL, and enforce admin security and abuse protection.
4. Apply the founder SQL migration **only to the new project** and independently verify policies and permissions.
5. Prepare German/English GDPR Article 13 privacy notice, processing records, data processor agreement, retention and incident/DSAR procedures; address sensitive sexual orientation data and age assurance. Until then do not invite anyone.
6. Configure isolated founder-delete Edge Function with server-only service role and strict allowed application origin. Verify authentication, self-deletion, and post-deletion empty rows.
7. Only after successful onboarding and safety review, invite the first consenting adult founder tester by verified email. **Founder membership is free and cannot be upgraded or paid through this module.**
8. Validate flow: invite → confirm email → private profile → owner-only fetch → update → data export → delete → no orphan rows.
9. Invite a second adult only after moderation, block/report functionality, security tests, anti-abuse procedures, storage/backup and deletion policies work.

## Hard failures
- Any user besides the owner can access or modify the private profile.
- A client can modify server-owned role, age-review status or membership state.
- A record becomes discoverable without explicit consent, or a fictional profile appears as real.
- Real sign-ups are possible on an ephemeral database.
- Deletion leaves orphan records; access tokens are falsely claimed instantly revoked.
- An unapproved paid plan, checkout or unsolicited marketing is activated.

## Local deterministic CI
- GitHub workflow starts a disposable PostgreSQL 17 database.
- Test fixture mocks only the Auth identity table and user-id lookup for **synthetic** users.
- The actual migration is applied and checks row-level isolation, role integrity, privacy default, suspension and cascade deletion.
- This alone does **not** prove real email delivery, age verification or GDPR compliance.
