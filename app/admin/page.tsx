import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMember, TIER_LABEL, type Status, type Tier } from '../../lib/member';
import { review, setTeam } from './actions';
import { tierInfo } from '../../lib/tiers';
import SubmitButton from '../../components/SubmitButton';

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

// The Everyone list, split by group
const GROUPS = [
  { id: 'all', label: 'All', test: (_r: Row) => true },
  { id: 'team', label: 'Team', test: (r: Row) => !!r.is_team },
  { id: 'community', label: 'The Community', test: (r: Row) => r.status === 'approved' && r.tier === 'community' },
  { id: 'club', label: 'The Club', test: (r: Row) => r.status === 'approved' && r.tier === 'club' },
  { id: 'inner_circle', label: 'The Inner Circle', test: (r: Row) => r.status === 'approved' && r.tier === 'inner_circle' },
  { id: 'other', label: 'Waitlist, declined, paused', test: (r: Row) => ['waitlisted', 'declined', 'suspended'].includes(r.status) },
] as const;

export default async function Admin({ searchParams }: { searchParams: Promise<{ view?: string; g?: string; note?: string }> }) {
  const { supabase, user, profile } = await getMember();
  if (!user) redirect('/login');
  if (!profile?.is_admin) redirect('/home');

  const sp = await searchParams;
  const view = sp.view === 'all' ? 'all' : 'review';
  const group = GROUPS.find((g) => g.id === sp.g) ?? GROUPS[0];
  const { data, error } = await supabase.rpc('admin_applicants');
  const everyone = (data ?? []) as Row[];
  const rows = everyone.filter((r) => (view === 'review' ? r.status === 'applicant' : group.test(r)));
  const waiting = everyone.filter((r) => r.status === 'applicant').length;
  const [{ data: reports }, { data: renewals }] = await Promise.all([supabase.rpc('admin_reports'), supabase.rpc('admin_renewals')]);
  const openReports = (reports ?? []).length;
  const dueRenewals = (renewals ?? []).length;
  const here = view === 'all' ? `/admin?view=all${group.id === 'all' ? '' : `&g=${group.id}`}` : '/admin';

  return (
    <main className="page admin">
      <Link href="/card" className="back">← Back to the app</Link>
      <h1 className="display">Review queue</h1>
      <p className="muted intro">Only admins can see this page. Notes are never shown to applicants. Approving someone sends them a welcome email.</p>
      <div className="seg" style={{ marginBottom: 16 }}>
        <Link href="/admin" className={view === 'review' ? 'on' : ''}>To review ({waiting})</Link>
        <Link href="/admin?view=all" className={view === 'all' ? 'on' : ''}>Everyone</Link>
        <Link href="/admin/reports">Reports ({openReports})</Link>
        <Link href="/admin/renewals">Renewals ({dueRenewals})</Link>
      </div>
      {view === 'all' && (
        <div className="chips" role="group" aria-label="Show" style={{ marginBottom: 14 }}>
          {GROUPS.map((g) => (
            <Link key={g.id} href={`/admin?view=all${g.id === 'all' ? '' : `&g=${g.id}`}`} className={`chip${group.id === g.id ? ' on' : ''}`}>
              {g.label} ({everyone.filter(g.test).length})
            </Link>
          ))}
        </div>
      )}
      {sp.note && <p className="notice" style={{ marginBottom: 14 }}>{sp.note}</p>}

      {error && <p className="form-error">Couldn&apos;t load applications: {error.message}</p>}
      {!error && rows.length === 0 && (
        <div className="soon">
          <p>{view === 'review' ? 'Nobody waiting. All caught up.' : 'Nobody in this group yet.'}</p>
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
              <input type="hidden" name="prev_status" value={r.status} />
              <input type="hidden" name="back" value={here} />
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
                <SubmitButton name="decision" value="approved" className="wbtn wbtn-fill" pending="Saving…">
                  {r.status === 'approved' ? 'Save' : 'Approve'}
                </SubmitButton>
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
                <input type="hidden" name="back" value={here} />
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
