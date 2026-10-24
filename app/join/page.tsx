import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmailSignIn from '../../components/EmailSignIn';
import { getMember, homeFor } from '../../lib/member';

export default async function Join() {
  const { user, profile, applied } = await getMember();
  if (user) redirect(homeFor(profile, applied));

  return (
    <main className="page auth-page">
      <Link href="/" className="back">← Back</Link>
      <h1 className="display">Join the community.</h1>
      <p className="muted intro">
        Membership is by application, and every application is read by a person on the team. Start with your email; we&apos;ll
        send you a link to fill in a short form.
      </p>
      <EmailSignIn mode="join" />
      <p className="muted small-print">
        Already a member? <Link href="/login" className="inline-link">Sign in</Link>
      </p>
    </main>
  );
}
