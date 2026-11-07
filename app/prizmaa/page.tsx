import PrizmaaExperience from "./experience/page";

// The multilingual, privacy-first experience is the single canonical landing.
// The previous landing remains as a non-production reference at /prizmaa/classic.
// Member authentication and discovery policies remain unchanged.
export default function PrizmaaWelcome() {
  return <PrizmaaExperience />;
}
