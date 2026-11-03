# PRIZMAA — Bounded Product Learning v1 (23 October 2026)

## Operational truth
PRIZMAA currently has **zero Supabase Auth users and zero real feedback events**. This implementation does not claim that AI has independently learned from actual community behavior or that the social network has launched.

The invitation-only beta is backed by the existing Supabase project `iyxmfiyvikrbfrscsaja`. Code lives on `feature/prizmaa-private-member-workspace-20261023` pending review, not on the production `main` branch.

## Live feedback loop
1. **Collect**: Only a logged-in invited member whose `membership_state=active` and `adult_review_state=verified` may submit an *optional* category/1–5 quality rating with affirmative consent. No free-form comments or private message contents.
2. **Bound**: Exact categories: `onboarding`, `profile`, `privacy`, `navigation`, `accessibility`, `reliability`. Exactly one rating per category per member per UTC day enforced by database unique constraint; no public writes. Feedback is attributed for self-access, deletion and anti-flood only; no public per-member scores.
3. **Learn**: `prizmaa_internal.refresh_feedback_quality_v1()` aggregates feedback once daily through pg_cron `prizmaa-feedback-quality-daily-v1`, 02:30 **UTC**. The function cleans events older than 90 days. The internal rollup includes only category counts, distinct member count, smoothed mean and state.
4. **Evidence threshold**: Fewer than 10 submissions **or** 10 distinct users => `insufficient_evidence`. The smoothed rating is `(sum(rating)+30)/(count+10)`; only with sufficient real evidence: <2.80 `investigate`, <3.40 `watch`, else `healthy`.
5. **Guard**: This feedback can never automatically change a user's ranking, profile visibility, block rules, message access or production software. A human must review any proposed UX adjustment and the tests before shipping.
6. **Rollback**: If aggregate metrics appear harmful or data handling becomes uncertain, disable UI collection and `cron.unschedule('prizmaa-feedback-quality-daily-v1')` after checking the job; do not delete historical data without a defined retention process.

## Privacy guarantees
- `public.prizmaa_product_feedback` RLS and per-member ownership; anonymous clients have no table grant.
- `prizmaa_internal.feedback_quality_rollup` is in a schema not exposed to browser REST. Privileges for anon/authenticated are revoked.
- `public.prizmaa_private_profiles` has storage-level `CHECK(visible_in_discovery=false)` on top of owner-only RLS. Do not remove until discovery/block/message threat model is reviewed.
- Existing sign-in still requires prior verification/invitation. Self-attested 18+ is not treated as verified identity.
- Feedback export and owner-requested deletion are in the beta. Expiration runs daily; if the scheduler stops, retention needs explicit operational attention.
- Device-level/session privacy: no localStorage, no marketing pixels, no tracking of sexual orientation, precise whereabouts, messages or preferences.

## Verify, without inventing real participants
```sql
SELECT * FROM prizmaa_internal.refresh_feedback_quality_v1() ORDER BY area;
SELECT jobname, schedule, active FROM cron.job WHERE jobname='prizmaa-feedback-quality-daily-v1';
SELECT COUNT(*) AS real_events FROM public.prizmaa_product_feedback;
SELECT state,observations,distinct_members FROM prizmaa_internal.feedback_quality_rollup;
```
`node --test scripts/test-prizmaa-member.mjs` is the committed UI/rules regression suite. It is not evidence that authentication, delivery, or production load works end-to-end until a real approved tester exercises the flow.

## Release gates
- Confirm next daily pg_cron run succeeded in `cron.job_run_details`.
- Have an approved 18+ tester sign in and independently verify: unauthorized user denied; profile stays private; optional rating accepted; duplicate daily rating rejected; exported feedback included; deleted feedback disappears from own REST reads.
- Confirm no cross-user reads, no secret key exposure and owner-only deletion.
- Obtain accessibility, abuse moderation and consent reviews before social discovery or messages are launched.
- Revisit hosting terms and a stable custom domain before any commercial public release.

## No misleading autonomy
This is an **automatic feedback aggregation and prioritization system**, not a self-retraining language model or automatically evolving production code. Human approval is a deliberate reliability and privacy boundary.
