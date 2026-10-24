import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireApprovedMember } from '../../../../lib/member';
import { canUseBackRoom, channelLabel, timeAgo, type Reply, type Thread } from '../../../../lib/forum';
import BackRoomLocked from '../../../../components/BackRoomLocked';
import { createReply, deletePost, hidePost, reportPost } from '../actions';

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const id = Number((await params).id);
  const reported = (await searchParams).reported === '1';
  if (!id) notFound();

  const [{ data: thread }, { data: replyRows }] = await Promise.all([
    supabase.from('forum_threads').select('*').eq('id', id).maybeSingle(),
    supabase.from('forum_replies').select('*').eq('thread_id', id).order('created_at', { ascending: true }),
  ]);
  if (!thread) notFound();
  const t = thread as Thread;
  const replies = (replyRows ?? []) as Reply[];
  const admin = profile.is_admin;

  const PostTools = ({ authorId, replyId, hidden }: { authorId: string; replyId?: number; hidden: boolean }) => (
    <div className="post-tools">
      {authorId === profile.id ? (
        <form action={deletePost}>
          <input type="hidden" name="thread_id" value={t.id} />
          {replyId && <input type="hidden" name="reply_id" value={replyId} />}
          <button className="tool-btn">Delete</button>
        </form>
      ) : (
        <form action={reportPost}>
          <input type="hidden" name="thread_id" value={t.id} />
          {replyId && <input type="hidden" name="reply_id" value={replyId} />}
          <button className="tool-btn">Report</button>
        </form>
      )}
      {admin && (
        <form action={hidePost}>
          <input type="hidden" name="thread_id" value={t.id} />
          {replyId && <input type="hidden" name="reply_id" value={replyId} />}
          <input type="hidden" name="hide" value={hidden ? 'false' : 'true'} />
          <button className="tool-btn tool-admin">{hidden ? 'Restore' : 'Remove'}</button>
        </form>
      )}
    </div>
  );

  return (
    <main className="page">
      <Link href={`/forum?c=${t.channel}`} className="back">← # {channelLabel(t.channel)}</Link>
      {reported && <p className="notice" style={{ marginBottom: 14 }}>Thanks — the team will take a look. Reports are private.</p>}

      <article className={`post post-main${t.hidden ? ' is-hidden' : ''}`}>
        <h1 className="display post-title">{t.title}</h1>
        <div className="post-by">
          {t.author_name ?? 'A member'} · {timeAgo(t.created_at)}
          {t.hidden && ' · removed (only admins see this)'}
        </div>
        <p className="post-body">{t.body}</p>
        <PostTools authorId={t.author_id} hidden={t.hidden} />
      </article>

      <div className="label" style={{ margin: '22px 0 10px' }}>
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </div>
      <div className="reply-list">
        {replies.map((r) => (
          <article key={r.id} className={`post${r.hidden ? ' is-hidden' : ''}`}>
            <div className="post-by">
              <strong>{r.author_name ?? 'A member'}</strong> · {timeAgo(r.created_at)}
              {r.hidden && ' · removed'}
            </div>
            <p className="post-body">{r.body}</p>
            <PostTools authorId={r.author_id} replyId={r.id} hidden={r.hidden} />
          </article>
        ))}
      </div>

      <form action={createReply} className="form reply-form">
        <input type="hidden" name="thread_id" value={t.id} />
        <label className="field">
          <span className="label">Reply as {profile.display_name || 'a member'}</span>
          <textarea name="body" required maxLength={4000} rows={3} placeholder="Write a reply…" />
        </label>
        <button className="wbtn wbtn-fill">Reply</button>
      </form>
    </main>
  );
}
