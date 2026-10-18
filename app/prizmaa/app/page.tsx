import { redirect } from 'next/navigation';

// Do not expose archived cultural test content inside the dating app.
export default function LegacyPrizmaaRoute() {
  redirect('/prizmaa/member');
}
