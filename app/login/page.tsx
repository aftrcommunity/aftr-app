import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmailSignIn from '../../components/EmailSignIn';
import { getMember, homeFor } from '../../lib/member';

export default async function Login({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { user, profile, applied } = await getMember();
  if (user) redirect(homeFor(profile, applied));
  const expired = (await searchParams).link === 'expired';

  return (
    <main className="page auth-page">
      <Link href="/" className="back">← Back</Link>
      <h1 className="display">Welcome back.</h1>
      <p className="muted intro">Sign in with the email on your membership. No password needed.</p>
      {expired && <p className="form-error">That sign-in link has expired or was already used. Ask for a new one below.</p>}
      <EmailSignIn mode="login" />
      <p className="muted small-print">
        Not a member yet? <Link href="/join" className="inline-link">Join the community</Link>
      </p>
    </main>
  );
}
