import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMember, TIER_LABEL, type Tier } from '../../../lib/member';
import { emailReady } from '../../../lib/email';
import SubmitButton from '../../../components/SubmitButton';
import { remindRenewal } from '../actions';

type Row = { user_id: string; email: string; display_name: string | null; full_name: string | null; tier: Tier; paid_until: string; reminded_at: string | null };

const day = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default async function Renewals({ searchParams }: { searchParams: Promise<{ note?: string }> }) {
  const { supabase, user, profile } = await getMember();
  if (!user) redirect('/login');
  if (!profile?.is_admin) redirect('/home');
  const note = (await searchParams).note;
  const { data, error } = await supabase.rpc('admin_renewals');
  const rows = (data ?? []) as Row[];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="page admin">
      <Link href="/admin" className="back">← Review queue</Link>
      <h1 className="display">Renewals</h1>
      <p className="muted intro">
        Club and Inner Circle members whose membership ends in the next 30 days, or has ended. Members also see a reminder in
        the app from 30 days before. When someone pays, update their paid-until date in Everyone.
      </p>
      {!emailReady() && <p className="form-error">Emails can’t send yet: add RESEND_API_KEY in Vercel (see the setup steps).</p>}
      {note && <p className="notice">{note}</p>}
      {error && <p className="form-error">Couldn&apos;t load renewals: {error.message}</p>}
      {!error && rows.length === 0 && <div className="soon"><p>Nobody is due for renewal in the next 30 days.</p></div>}
      <div className="admin-list">
        {rows.map((r) => (
          <article key={r.user_id} className="admin-card">
            <div className="admin-head">
              <div>
                <h2 className="admin-name">{r.full_name ?? r.display_name ?? r.email}</h2>
                <div className="admin-sub">{TIER_LABEL[r.tier]} · {r.email}</div>
              </div>
              <span className={`status ${r.paid_until < today ? 'status-declined' : 'status-waitlisted'}`}>
                {r.paid_until < today ? 'Ended' : 'Due'} {day(r.paid_until)}
              </span>
            </div>
            {r.reminded_at && <p className="muted" style={{ marginTop: 8 }}>Reminder sent {day(r.reminded_at)}</p>}
            <form action={remindRenewal} style={{ marginTop: 12 }}>
              <input type="hidden" name="user_id" value={r.user_id} />
              <SubmitButton className="wbtn wbtn-outline" pending="Sending…">
                {r.reminded_at ? 'Send another reminder' : 'Email a renewal reminder'}
              </SubmitButton>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
