import { redirect } from 'next/navigation';
import { getMember, homeFor } from '../../../lib/member';

// After signing in: approved members go in, everyone else to their next step.
export default async function RouteAfterSignIn() {
  const { user, profile, applied } = await getMember();
  if (!user) redirect('/login');
  redirect(homeFor(profile, applied));
}
