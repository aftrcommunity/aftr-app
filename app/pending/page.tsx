import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMember } from '../../lib/member';

const COPY = {
  applicant: {
    title: 'Thank you.',
    body: 'Your application is in. A person on the team will read it and get back to you, usually within a week. You can close the app; we’ll email you.',
  },
  waitlisted: {
    title: 'You’re on the waitlist.',
    body: 'We keep AFTR. small on purpose, so we’re not able to welcome you just yet. We’ll be in touch when a place opens up.',
  },
  declined: {
    title: 'Not right now.',
    body: 'We’re not able to offer membership at the moment. Thank you for wanting to be part of AFTR.',
  },
  suspended: {
    title: 'Your membership is paused.',
    body: 'Please contact the AFTR. team if you have questions.',
  },
} as const;

export default async function Pending() {
  const { user, profile, applied } = await getMember();
  if (!user) redirect('/login');
  if (profile?.status === 'approved') redirect('/home');
  if (profile?.status === 'applicant' && !applied) redirect('/apply');

  const copy = COPY[(profile?.status ?? 'applicant') as keyof typeof COPY];
  return (
    <main className="page auth-page">
      <img src="/images/logo.png" alt="AFTR." style={{ width: 64, marginBottom: 28 }} />
      <h1 className="display">{copy.title}</h1>
      <p className="muted intro" style={{ fontSize: 14.5 }}>{copy.body}</p>
      <form action="/auth/signout" method="post">
        <button className="wbtn wbtn-outline">Sign out</button>
      </form>
      <p className="muted small-print"><Link href="/" className="inline-link">Back to start</Link></p>
    </main>
  );
}
