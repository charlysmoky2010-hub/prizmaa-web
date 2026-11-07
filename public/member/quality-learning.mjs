// Mirrors the deployed private Supabase quality policy.
// The database function remains authoritative for production decisions.
// No network, identifiers or production data required for offline safety tests.
export const QUALITY_AREAS=Object.freeze([
  "accessibility","navigation","onboarding","privacy","profile","reliability"
]);
export const QUALITY_ACTIONS=Object.freeze({
  accessibility:"audit_keyboard_and_contrast",
  navigation:"simplify_navigation_flow",
  onboarding:"clarify_invitation_onboarding",
  privacy:"improve_privacy_explanations",
  profile:"simplify_private_profile_editor",
  reliability:"investigate_authenticated_error_flows"
});
export function decideQuality(area,events,members,smoothed) {
  if(!QUALITY_AREAS.includes(area) || !Number.isInteger(events) || !Number.isInteger(members) ||
     events<0 || members<0 || members>events || typeof smoothed!=="number" ||
     !Number.isFinite(smoothed) || smoothed<1 || smoothed>5) throw Error("INVALID_QUALITY_EVIDENCE");
  const decision=events<10||members<10?"insufficient_evidence":
    smoothed<2.8?"human_review":smoothed<3.4?"watch":"healthy";
  const propose=decision==="human_review"||decision==="watch";
  const priority=propose?Math.min(100,Math.max(1,Math.round((3.4-smoothed)*28 +
    (["privacy","accessibility","reliability"].includes(area)?28:8)))):0;
  return {area,model_version:"prizmaa-quality-policy-1",
    evidence_count:events,distinct_members:members,
    smoothed_mean:smoothed,decision,priority,
    proposed_change:propose?QUALITY_ACTIONS[area]:null,
    review_required:propose,
    automatic_code_changes:false,automatic_member_profiling:false};
}
// Executed on synthetic fixtures only. Production aggregation happens in Postgres,
// where real member IDs never enter the public learning decision report.
export function learnFromSyntheticRatings(area,records) {
  if(!Array.isArray(records))throw Error("INVALID_TEST_DATA");
  const participants=new Set();
  let sum=0;
  for(const r of records){
    if(!r || typeof r.actor!=="string" || !r.actor || !Number.isInteger(r.rating) ||
      r.rating<1 || r.rating>5)throw Error("INVALID_TEST_RATING");
    participants.add(r.actor);sum+=r.rating;
  }
  const smooth=Math.round(((sum+30)/(records.length+10))*100)/100;
  return decideQuality(area,records.length,participants.size,smooth);
}
