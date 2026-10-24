import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMember, TIER_LABEL, type Status, type Tier } from '../../lib/member';
import { review, setTeam } from './actions';
import { tierInfo } from '../../lib/tiers';

type Row = {
  user_id: string;
  email: string;
  display_name: string | null;
  status: Status;
  tier: Tier;
  paid_until: string | null;
  member_number: number;
  full_name: string | null;
  contact: string | null;
  instagram: string | null;
  referred_by: string | null;
  why_aftr: string | null;
  submitted_at: string | null;
  requested_tier: Tier | null;
  is_team?: boolean;
  team_title?: string | null;
  team_email?: string | null;
  notes: string[];
};

const STATUS_LABEL: Record<Status, string> = {
  applicant: 'To review',
  approved: 'Member',
  waitlisted: 'Waitlist',
  declined: 'Declined',
  suspended: 'Paused',
};

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Accra' }) : '';

export default async function Admin({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { supabase, user, profile } = await getMember();
  if (!user) redirect('/login');
  if (!profile?.is_admin) redirect('/home');

  const view = (await searchParams).view === 'all' ? 'all' : 'review';
  const { data, error } = await supabase.rpc('admin_applicants');
  const rows = ((data ?? []) as Row[]).filter((r) => (view === 'review' ? r.status === 'applicant' : true));
  const waiting = ((data ?? []) as Row[]).filter((r) => r.status === 'applicant').length;
  const { data: reports } = await supabase.rpc('admin_reports');
  const openReports = (reports ?? []).length;

  return (
    <main className="page admin">
      <Link href="/card" className="back">← Back to the app</Link>
      <h1 className="display">Review queue</h1>
      <p className="muted intro">Only the AFTR. team can see this page. Notes are never shown to applicants.</p>
      <div className="seg" style={{ marginBottom: 16 }}>
        <Link href="/admin" className={view === 'review' ? 'on' : ''}>To review ({waiting})</Link>
        <Link href="/admin?view=all" className={view === 'all' ? 'on' : ''}>Everyone</Link>
        <Link href="/admin/reports">Reports ({openReports})</Link>
      </div>

      {error && <p className="form-error">Couldn&apos;t load applications: {error.message}</p>}
      {!error && rows.length === 0 && (
        <div className="soon">
          <p>{view === 'review' ? 'Nobody waiting. All caught up.' : 'No applications yet.'}</p>
        </div>
      )}

      <div className="admin-list">
        {rows.map((r) => (
          <article key={r.user_id} className="admin-card">
            <div className="admin-head">
              <div>
                <h2 className="admin-name">{r.full_name ?? r.display_name ?? r.email}</h2>
                <div className="admin-sub">
                  {r.display_name && <>Goes by {r.display_name} · </>}
                  {r.email}
                </div>
              </div>
              <span className={`status status-${r.status}`}>
                {STATUS_LABEL[r.status]}
                {r.status === 'approved' && ` · ${TIER_LABEL[r.tier].replace('The ', '')}`}
              </span>
              {r.is_team && <span className="team-badge">Team</span>}
            </div>

            <dl className="admin-facts">
              {r.contact && (<><dt>Contact</dt><dd>{r.contact}</dd></>)}
              {r.instagram && (<><dt>Instagram</dt><dd>{r.instagram}</dd></>)}
              {r.referred_by && (<><dt>Referred by</dt><dd>{r.referred_by}</dd></>)}
              {r.requested_tier && (
                <><dt>Asked for</dt><dd>{tierInfo(r.requested_tier).name} · {tierInfo(r.requested_tier).price}</dd></>
              )}
              {r.submitted_at && (<><dt>Applied</dt><dd>{when(r.submitted_at)}</dd></>)}
              {r.status === 'approved' && (<><dt>Paid until</dt><dd>{r.paid_until ?? 'Not recorded'}</dd></>)}
            </dl>
            {r.why_aftr && <p className="admin-why">“{r.why_aftr}”</p>}
            {r.notes.length > 0 && (
              <ul className="admin-notes">
                {r.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}

            <form action={review} className="admin-form">
              <input type="hidden" name="user_id" value={r.user_id} />
              <div className="admin-row">
                <label className="field">
                  <span className="label">Tier</span>
                  <select name="tier" defaultValue={r.status === 'applicant' ? (r.requested_tier ?? r.tier) : r.tier}>
                    <option value="community">The Community (free)</option>
                    <option value="club">The Club</option>
                    <option value="inner_circle">The Inner Circle</option>
                  </select>
                </label>
                <label className="field">
                  <span className="label">Paid until</span>
                  <input type="date" name="paid_until" defaultValue={r.paid_until ?? ''} />
                </label>
              </div>
              {r.status === 'applicant' && r.requested_tier && r.requested_tier !== 'community' && (
                <p className="admin-hint">Asked for a paid tier. Approve as The Community until payment is confirmed, or set the paid-until date if she&apos;s paid.</p>
              )}
              <label className="field">
                <span className="label">Private note (optional)</span>
                <input name="note" maxLength={1000} placeholder="e.g. Knows two members, came to WDGD 5" />
              </label>
              <div className="admin-actions">
                <button name="decision" value="approved" className="wbtn wbtn-fill">
                  {r.status === 'approved' ? 'Save' : 'Approve'}
                </button>
                {r.status !== 'approved' && (
                  <>
                    <button name="decision" value="waitlisted" className="wbtn wbtn-outline">Waitlist</button>
                    <button name="decision" value="declined" className="wbtn wbtn-outline">Decline</button>
                  </>
                )}
                {r.status === 'approved' && r.user_id !== user.id && (
                  <button name="decision" value="suspended" className="wbtn wbtn-outline">Pause membership</button>
                )}
              </div>
            </form>
            {r.status === 'approved' && (
              <form action={setTeam} className="admin-form team-form">
                <input type="hidden" name="user_id" value={r.user_id} />
                <label className="check">
                  <input type="checkbox" name="is_team" defaultChecked={!!r.is_team} />
                  <span>
                    <strong>AFTR. team</strong> — access to everything, a Team badge in the Back Room, and the team card. Doesn&apos;t
                    give access to this review queue.
                  </span>
                </label>
                <div className="admin-row">
                  <label className="field">
                    <span className="label">Title on card</span>
                    <input name="team_title" maxLength={60} defaultValue={r.team_title ?? ''} placeholder="e.g. Founder" />
                  </label>
                  <label className="field">
                    <span className="label">Work email on card</span>
                    <input name="team_email" type="email" maxLength={120} defaultValue={r.team_email ?? ''} placeholder="name@aftr.community" />
                  </label>
                </div>
                <button className="wbtn wbtn-outline">Save team details</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
