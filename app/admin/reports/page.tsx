import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMember } from '../../../lib/member';
import { timeAgo } from '../../../lib/forum';
import { handleReport } from './actions';

type Report = {
  id: number;
  created_at: string;
  reason: string | null;
  thread_id: number;
  reply_id: number | null;
  title: string | null;
  excerpt: string | null;
  author_name: string | null;
  hidden: boolean | null;
};

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
      <p className="muted intro">Posts members have reported in the Back Room. Reporters stay anonymous to everyone but you.</p>
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
                <h2 className="admin-name">{r.reply_id ? 'A reply' : 'A post'} by {r.author_name ?? 'a member'}</h2>
                <div className="admin-sub">
                  in “{r.title}” · reported {timeAgo(r.created_at)}
                  {r.hidden && ' · already removed'}
                </div>
              </div>
            </div>
            <p className="admin-why">“{r.excerpt}”</p>
            <div className="admin-actions" style={{ marginTop: 12 }}>
              <Link href={`/forum/${r.thread_id}`} className="wbtn wbtn-outline">View</Link>
              <form action={handleReport} style={{ flex: 1, display: 'flex' }}>
                <input type="hidden" name="report_id" value={r.id} />
                <input type="hidden" name="thread_id" value={r.thread_id} />
                {r.reply_id && <input type="hidden" name="reply_id" value={r.reply_id} />}
                <input type="hidden" name="remove" value="yes" />
                <button className="wbtn wbtn-fill">Remove post</button>
              </form>
              <form action={handleReport} style={{ flex: 1, display: 'flex' }}>
                <input type="hidden" name="report_id" value={r.id} />
                <button className="wbtn wbtn-outline">Keep it</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
