# PRIZMAA — Gay Social Platform Product Recovery v1 (17 Oct 2026)

## Truth from the current codebase
The current Next.js `app/page.tsx` presents a seven-pillar cultural directory (Discover, Culture, Community, Opportunities, Experiences, Creator Studio, Partner Space). That is useful cultural content but not a tested member-to-member social product. The partner inquiry in the landing code currently toggles a local success state; it should not be treated as a persisted lead without confirmed API write.

## Product promise
PRIZMAA is an **18+ gay social and community platform**, centered on personal profiles, mutual discovery, conversation, consent and real-world social belonging. It is *not primarily a sexual-chat site*, and a competitor's brand, artwork or proprietary UI should not be copied. Orientation and identity privacy are critical.

## Version 1 user journey
1. An adult arrives at a clear social landing page with privacy disclosure, not a cultural directory.
2. Creates an account and confirms email; age gate and terms accepted before public exposure.
3. Sets profile: chosen name, avatar, language, general region, interests, visibility controls; all sensitive details optional.
4. Explores member cards with search and basic filters, without revealing precise location.
5. Sends a connection request; messaging opens only under the product's consent model.
6. Can block/report, delete account and export own data easily.

## Working acceptance criteria (not yet implemented/verified)
- No user profile rendered publicly by default; visibility must be chosen knowingly.
- No location coordinates or exact distance exposed to members; no inference via search filters.
- Match/discovery respects block lists and private/hidden state.
- Conversation authorization is checked server-side for *every* read/write.
- Rate limit account creation, discovery, messages and report forms; abuse queue and escalation procedure.
- No intimate data sent to advertising networks; GDPR data minimization, explicit retention and deletion paths.
- 18+ policy and abuse moderation must be enforced, not a decorative checkbox.
- Mobile-first accessible UI and meaningful empty states; no fabricated user accounts or community activity.

## Prioritized work order
**P0: Identity and permissions** — verified authentication, profile privacy schema, access-control tests, report/block.
**P1: Social loop** — search and member discovery, connection requests, consent-based direct messages.
**P2: Community loop** — interest groups, events and user moderation.
**P3: Revenue** — premium optional features only after useful and safe core; no sale of sensitive identity data.

## Repo architecture decision
Keep `prizmaa-web` as the candidate public social frontend; assess `prizma-omnicore` as a separate existing cultural/verification backend, not a second competing user-facing PRIZMAA brand. An actual integration decision requires checking database schema, auth, existing APIs and deployment. Do not delete either repository or overwrite working cultural features before migration planning.

## Single next executable gate
Implement and test one real private-by-default member-profile route backed by authenticated storage, then member discovery gated on visibility and blocks. A flashy 3D landing page is not a substitute for a functioning social loop.
