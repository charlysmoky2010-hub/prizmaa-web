import { redirect } from 'next/navigation';

export default function PrizmaaGatewayPage() {
  // Dating studio is the primary PRIZMAA product. The root cultural landing is preserved.
  redirect('/prizmaa/beta');
}
