export function memberApproved(member) {
  return Boolean(member && member.membership_state === "active" && member.adult_review_state === "verified");
}
export function normalizeProfile(input) {
  const display_name = typeof input.display_name === "string" ? input.display_name.trim() : "";
  const location_label = typeof input.location_label === "string" ? input.location_label.trim() : "";
  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
  if (display_name.length < 2 || display_name.length > 36) throw Error("NAME_LENGTH");
  if (location_label.length > 44 || /(\d{3,}|-?\d+\.\d+[,; ]+-?\d+\.\d+)/.test(location_label)) throw Error("LOCATION_UNSAFE");
  if (bio.length > 400) throw Error("BIO_LENGTH");
  return { display_name, location_label, bio, visible_in_discovery: false };
}
export function privateExport(user, member, profile) {
  return { exported_at: new Date().toISOString(), scope: "authenticated_owner_only",
    identity: { id: user?.id ?? null, email: user?.email ?? null },
    membership: member ? { member_role: member.member_role, membership_state: member.membership_state, adult_review_state: member.adult_review_state } : null,
    profile: profile ?? null };
}

export const FEEDBACK_AREAS = Object.freeze(["onboarding","profile","privacy","navigation","accessibility","reliability"]);
export function normalizeFeedback(area,rating,consent) {
  if(consent!==true)throw Error("FEEDBACK_CONSENT_REQUIRED");
  if(typeof area!=="string"||!FEEDBACK_AREAS.includes(area))throw Error("FEEDBACK_AREA_INVALID");
  const n=Number(rating);
  if(!Number.isInteger(n)||n<1||n>5)throw Error("FEEDBACK_RATING_INVALID");
  return {area,rating:n};
}
