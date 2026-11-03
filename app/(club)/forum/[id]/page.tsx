import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireApprovedMember } from '../../../../lib/member';
import { canUseBackRoom, channelLabel, timeAgo, type Reaction, type Reply, type Thread } from '../../../../lib/forum';
import { photoLinks } from '../../../../lib/media';
import BackRoomLocked from '../../../../components/BackRoomLocked';
import PhotoGrid from '../../../../components/PhotoGrid';
import SubmitButton from '../../../../components/SubmitButton';
import { clearVote, createReply, deletePost, hidePost, toggleReaction, votePoll } from '../actions';
import { block, mute } from '../../members/actions';

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const id = Number((await params).id);
  if (!id) notFound();

  const [{ data: thread }, { data: replyRows }, { data: reactionRows }, { data: poll }, { data: myVote }, { data: hiddenRows }] =
    await Promise.all([
      supabase.from('forum_threads').select('*').eq('id', id).maybeSingle(),
      supabase.from('forum_replies').select('*').eq('thread_id', id).order('created_at', { ascending: true }),
      supabase.from('forum_reactions').select('thread_id, reply_id, user_id, kind').eq('thread_id', id),
      supabase.from('forum_polls').select('options').eq('thread_id', id).maybeSingle(),
      supabase.from('forum_poll_votes').select('option_index').eq('thread_id', id).maybeSingle(),
      supabase.rpc('hidden_people'),
    ]);
  if (!thread) notFound();
  const t = thread as Thread;
  const hidden = new Set<string>(((hiddenRows ?? []) as string[]).map(String));
  const admin = profile.is_admin;
  const back = `/forum/${t.id}`;

  if (hidden.has(t.author_id) && !admin) {
    return (
      <main className="page">
        <Link href="/forum" className="back">← The Back Room</Link>
        <div className="soon"><p>This conversation is from someone you’ve muted or blocked.</p></div>
      </main>
    );
  }

  const replies = ((replyRows ?? []) as Reply[]).filter((r) => !hidden.has(r.author_id));
  const reactions = (reactionRows ?? []) as Reaction[];
  const photos = await photoLinks(supabase, t.photos ?? []);
  const options = (poll?.options ?? []) as string[];
  const { data: results } = options.length ? await supabase.rpc('poll_results', { thread: id }) : { data: null };
  const votes = new Map(((results ?? []) as { option_index: number; votes: number }[]).map((r) => [r.option_index, Number(r.votes)]));
  const totalVotes = [...votes.values()].reduce((a, b) => a + b, 0);
  const mine = myVote?.option_index as number | undefined;

  // Replies to replies sit under the reply they answer
  const ids = new Set(replies.map((r) => r.id));
  const top = replies.filter((r) => !r.parent_id || !ids.has(r.parent_id));
  const children = (pid: number) => replies.filter((r) => r.parent_id === pid);

  const Author = ({ id: authorId, name, team }: { id: string; name: string | null; team?: boolean }) => (
    <>
      <Link href={`/members/${authorId}`} className="author-link">{name ?? 'A member'}</Link>
      {team && <span className="team-badge">Team</span>}
    </>
  );

  const Reactions = ({ replyId }: { replyId?: number }) => {
    const here = reactions.filter((r) => (r.reply_id ?? 0) === (replyId ?? 0));
    return (
      <div className="reactions">
        {(['love', 'like'] as const).map((kind) => {
          const n = here.filter((r) => r.kind === kind).length;
          const on = here.some((r) => r.kind === kind && r.user_id === profile.id);
          return (
            <form key={kind} action={toggleReaction}>
              <input type="hidden" name="thread_id" value={t.id} />
              {replyId && <input type="hidden" name="reply_id" value={replyId} />}
              <input type="hidden" name="kind" value={kind} />
              <button className={`react-btn${on ? ' on' : ''}`} aria-pressed={on} aria-label={`${kind === 'love' ? 'Love' : 'Like'}${n ? `, ${n}` : ''}`}>
                <span aria-hidden>{kind === 'love' ? '♥' : '👍'}</span>
                {n > 0 && <span>{n}</span>}
              </button>
            </form>
          );
        })}
      </div>
    );
  };

  const Menu = ({ authorId, authorName, replyId, isHidden }: { authorId: string; authorName: string; replyId?: number; isHidden: boolean }) => {
    const target = replyId ? `reply=${replyId}&thread=${t.id}` : `thread=${t.id}`;
    return (
      <details className="post-menu">
        <summary aria-label="More options">•••</summary>
        <div className="menu-sheet">
          {authorId === profile.id ? (
            <>
              <Link href={`/forum/${t.id}/edit${replyId ? `?reply=${replyId}` : ''}`} className="menu-item">Edit</Link>
              <form action={deletePost}>
                <input type="hidden" name="thread_id" value={t.id} />
                {replyId && <input type="hidden" name="reply_id" value={replyId} />}
                <button className="menu-item">Delete</button>
              </form>
            </>
          ) : (
            <>
              <Link href={`/report?${target}`} className="menu-item">Report</Link>
              <form action={mute}>
                <input type="hidden" name="member" value={authorId} />
                <input type="hidden" name="back" value={back} />
                <button className="menu-item">Mute {authorName}</button>
              </form>
              <form action={block}>
                <input type="hidden" name="member" value={authorId} />
                <input type="hidden" name="back" value={replyId ? back : '/forum'} />
                <button className="menu-item">Block {authorName}</button>
              </form>
            </>
          )}
          {admin && (
            <form action={hidePost}>
              <input type="hidden" name="thread_id" value={t.id} />
              {replyId && <input type="hidden" name="reply_id" value={replyId} />}
              <input type="hidden" name="hide" value={isHidden ? 'false' : 'true'} />
              <button className="menu-item menu-admin">{isHidden ? 'Restore (admin)' : 'Remove (admin)'}</button>
            </form>
          )}
        </div>
      </details>
    );
  };

  const ReplyBox = ({ parentId, label }: { parentId?: number; label: string }) => (
    <form action={createReply} className="form reply-form">
      <input type="hidden" name="thread_id" value={t.id} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <label className="field">
        <span className="label">{label}</span>
        <textarea name="body" required maxLength={4000} rows={parentId ? 2 : 3} placeholder="Write a reply…" />
      </label>
      <SubmitButton pending="Replying…">Reply</SubmitButton>
    </form>
  );

  const ReplyCard = ({ r, nested = false }: { r: Reply; nested?: boolean }) => (
    <article id={`reply-${r.id}`} className={`post${nested ? ' post-nested' : ''}${r.hidden ? ' is-hidden' : ''}`}>
      <div className="post-by">
        <Author id={r.author_id} name={r.author_name} team={r.author_is_team} /> · {timeAgo(r.created_at)}
        {r.edited_at && ' · edited'}
        {r.hidden && ' · removed'}
      </div>
      <p className="post-body">{r.body}</p>
      <div className="post-foot">
        <Reactions replyId={r.id} />
        <details className="reply-inline">
          <summary>Reply</summary>
          <ReplyBox parentId={r.id} label={`Reply to ${r.author_name ?? 'this member'}`} />
        </details>
        <Menu authorId={r.author_id} authorName={r.author_name ?? 'this member'} replyId={r.id} isHidden={r.hidden} />
      </div>
    </article>
  );

  return (
    <main className="page">
      <Link href={`/forum?c=${t.channel}`} className="back">← # {channelLabel(t.channel)}</Link>

      <article className={`post post-main${t.hidden ? ' is-hidden' : ''}`}>
        <h1 className="display post-title">{t.title}</h1>
        <div className="post-by">
          <Author id={t.author_id} name={t.author_name} team={t.author_is_team} /> · {timeAgo(t.created_at)}
          {t.edited_at && ' · edited'}
          {t.hidden && ' · removed (only admins see this)'}
        </div>
        <p className="post-body">{t.body}</p>
        <PhotoGrid photos={(t.photos ?? []).map((p) => photos.get(p)).filter((p) => !!p)} label="Photo" />

        {options.length > 0 && (
          <div className="poll">
            <div className="label">Poll · {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</div>
            {mine === undefined ? (
              <form action={votePoll} className="poll-form">
                <input type="hidden" name="thread_id" value={t.id} />
                {options.map((o, i) => (
                  <label key={i} className="poll-option">
                    <input type="radio" name="option" value={i} required />
                    <span>{o}</span>
                  </label>
                ))}
                <SubmitButton className="wbtn wbtn-outline poll-vote" pending="Voting…">Vote</SubmitButton>
                <p className="muted">Results show once you’ve voted. Votes are private.</p>
              </form>
            ) : (
              <div className="poll-results">
                {options.map((o, i) => {
                  const n = votes.get(i) ?? 0;
                  const pct = totalVotes ? Math.round((n / totalVotes) * 100) : 0;
                  return (
                    <div key={i} className={`poll-bar${mine === i ? ' mine' : ''}`}>
                      <span className="poll-fill" style={{ width: `${pct}%` }} aria-hidden />
                      <span className="poll-text">{o}{mine === i && ' · your vote'}</span>
                      <span className="poll-pct">{pct}%</span>
                    </div>
                  );
                })}
                <form action={clearVote}>
                  <input type="hidden" name="thread_id" value={t.id} />
                  <button className="link-btn">Change my vote</button>
                </form>
              </div>
            )}
          </div>
        )}

        <div className="post-foot">
          <Reactions />
          <Menu authorId={t.author_id} authorName={t.author_name ?? 'this member'} isHidden={t.hidden} />
        </div>
      </article>

      <div className="label" style={{ margin: '22px 0 10px' }}>
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </div>
      <div className="reply-list">
        {top.map((r) => (
          <div key={r.id} className="reply-group">
            <ReplyCard r={r} />
            {children(r.id).length > 0 && (
              <div className="reply-children">
                {children(r.id).map((c) => (
                  <ReplyCard key={c.id} r={c} nested />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <ReplyBox label={`Reply as ${profile.display_name || 'a member'}`} />
    </main>
  );
}
