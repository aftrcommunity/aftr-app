import { redirect } from 'next/navigation';
import ApplyForm from '../../components/ApplyForm';
import { getMember, homeFor } from '../../lib/member';

export default async function Apply() {
  const { user, profile, applied } = await getMember();
  if (!user) redirect('/join');
  if (applied || profile?.status !== 'applicant') redirect(homeFor(profile, applied));

  return (
    <main className="page auth-page">
      <div className="eyebrow">Membership application</div>
      <h1 className="display" style={{ marginTop: 10 }}>Tell us about you.</h1>
      <p className="muted intro">
        AFTR. is a members-only social club for womxn. Cis women, trans women and trans men are all welcome. A person on
        the team reads every application, usually within a week.
      </p>
      <ApplyForm />
    </main>
  );
}
