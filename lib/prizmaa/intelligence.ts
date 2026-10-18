/**
 * PRIZMAA Intelligence v0.1 — private, transparent discovery ordering.
 * IMPORTANT: This is deterministic preference matching, NOT a machine-learning
 * model or a statistically validated relationship-compatibility prediction.
 * It never reads private chat, sexuality inference, GPS, photos or third-party
 * data. Only opted-in discovery cards supplied by the existing privacy gate.
 */
export type DiscoveryProfile = {
  id: string;
  nickname: string;
  city?: string | null;
  intent?: string | null;
  tags?: string | null;
};
export type DiscoveryPreferences = {
  intent: string;
  interests: string;
  city: string;
};
export type DiscoverySuggestion<T extends DiscoveryProfile> = {
  person: T;
  priority: number;
  reasons: string[];
};
const normal = (s: string) => s.normalize("NFKC").trim().toLocaleLowerCase("en-US");
function terms(input: string) {
  return [...new Set(input.split(",").map(s => normal(s)).filter(Boolean))].slice(0, 15);
}
export function rankDiscovery<T extends DiscoveryProfile>(
  people: readonly T[], preferences: DiscoveryPreferences
): DiscoverySuggestion<T>[] {
  const interestSet = new Set(terms(preferences.interests.slice(0, 200)));
  const wantedIntent = normal(preferences.intent.slice(0, 30));
  const wantedCity = normal(preferences.city.slice(0, 50));
  const seen = new Set<string>();
  const ranked: DiscoverySuggestion<T>[] = [];
  for (const person of people.slice(0, 100)) {
    if (!person || !person.id || seen.has(person.id)) continue;
    seen.add(person.id);
    let priority = 0;
    const reasons: string[] = [];
    if (wantedIntent && wantedIntent !== "any" && normal(person.intent || "") === wantedIntent) {
      priority += 4;
      reasons.push("Same connection intention");
    }
    const shared = terms((person.tags || "").slice(0, 200)).filter(t => interestSet.has(t));
    if (shared.length) {
      priority += Math.min(shared.length, 3) * 2;
      reasons.push("Shared interests: " + shared.slice(0, 3).join(", "));
    }
    if (wantedCity && normal(person.city || "") === wantedCity) {
      priority += 2;
      reasons.push("Same chosen city");
    }
    if (!reasons.length) reasons.push("Explore this person's public profile");
    ranked.push({ person, priority, reasons });
  }
  // Ties retain the incoming discovery order, with no opaque behavioral score.
  return ranked.sort((a, b) => b.priority - a.priority);
}
