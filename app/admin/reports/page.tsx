import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMember } from '../../../lib/member';
import { reportCategoryLabel, timeAgo } from '../../../lib/forum';
import SubmitButton from '../../../components/SubmitButton';
import { handleReport } from './actions';

type Report = {
  id: number;
  created_at: string;
  category: string | null;
  reason: string | null;
  kind: 'post' | 'reply' | 'message' | 'profile';
  thread_id: number | null;
  reply_id: number | null;
  message_id: number | null;
  profile_id: string | null;
  title: string | null;
  excerpt: string | null;
  author_name: string | null;
  hidden: boolean | null;
};

const KIND = { post: 'A post', reply: 'A reply', message: 'A private message', profile: 'A profile' };

export default async function Reports() {
  const { supabase, user, profile } = await getMember();
  if (!user) redirect('/login');
  if (!profile?.is_admin) redirect('/home');

  const { data, error } = await supabase.rpc('admin_reports');
  const reports = (data ?? []) as Report[];

  return (
    <main className="page admin">
      <Link href="/admin" className="back">← Review queue</Link>
      <h1 className="display">Reports</h1>
      <p className="muted intro">
        Reported posts, replies, messages and profiles. Reporters stay anonymous. When you decide, the reporter gets a
        notification saying whether it was removed or kept. For a private message you only ever see the message that was
        reported.
      </p>
      {error && <p className="form-error">Couldn&apos;t load reports: {error.message}</p>}
      {!error && reports.length === 0 && (
        <div className="soon">
          <p>No open reports.</p>
        </div>
      )}
      <div className="admin-list">
        {reports.map((r) => (
          <article key={r.id} className="admin-card">
            <div className="admin-head">
              <div>
                <h2 className="admin-name">{KIND[r.kind]} by {r.author_name ?? 'a member'}</h2>
                <div className="admin-sub">
                  {r.title && <>in “{r.title}” · </>}reported {timeAgo(r.created_at)}
                  {r.hidden && ' · already removed'}
                </div>
              </div>
            </div>
            <div className="report-cat">{reportCategoryLabel(r.category)}</div>
            {r.reason && <p className="admin-hint" style={{ color: 'var(--n-300)', marginTop: 8 }}>Reporter says: “{r.reason}”</p>}
            {r.excerpt && <p className="admin-why">“{r.excerpt}”</p>}
            <div className="admin-actions" style={{ marginTop: 12 }}>
              {r.thread_id && (
                <Link href={`/forum/${r.thread_id}${r.reply_id ? `#reply-${r.reply_id}` : ''}`} className="wbtn wbtn-outline">View</Link>
              )}
              {r.profile_id && <Link href={`/members/${r.profile_id}`} className="wbtn wbtn-outline">View profile</Link>}
              {r.kind !== 'profile' && (
                <form action={handleReport} style={{ flex: 1, display: 'flex' }}>
                  <input type="hidden" name="report_id" value={r.id} />
                  <input type="hidden" name="remove" value="yes" />
                  <SubmitButton className="wbtn wbtn-fill" pending="…">Remove it</SubmitButton>
                </form>
              )}
              <form action={handleReport} style={{ flex: 1, display: 'flex' }}>
                <input type="hidden" name="report_id" value={r.id} />
                <SubmitButton className="wbtn wbtn-outline" pending="…">{r.kind === 'profile' ? 'Close report' : 'Keep it up'}</SubmitButton>
              </form>
            </div>
            {r.kind === 'profile' && (
              <p className="muted" style={{ marginTop: 8 }}>To act on a profile, pause the member’s membership in Everyone.</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
