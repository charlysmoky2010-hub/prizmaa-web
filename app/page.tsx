import { redirect } from 'next/navigation';

// The root route now serves the protected PRIZMAA member pilot.
// Existing cultural source remains safely on main until separate migration.
export default function PrizmaaHome() {
  redirect('/prizmaa/member');
}
