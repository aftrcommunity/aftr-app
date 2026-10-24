import Link from 'next/link';
import { requireApprovedMember } from '../../../lib/member';
import { CHANNELS, canUseBackRoom, channelLabel, isChannel, timeAgo, type Thread } from '../../../lib/forum';
import BackRoomLocked from '../../../components/BackRoomLocked';

export default async function Forum({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;

  const c = (await searchParams).c ?? '';
  const channel = isChannel(c) ? c : null;
  let q = supabase
    .from('forum_threads')
    .select('id, channel, title, body, author_name, reply_count, created_at, last_activity_at, hidden')
    .order('last_activity_at', { ascending: false })
    .limit(50);
  if (channel) q = q.eq('channel', channel);
  const { data } = await q;
  const threads = (data ?? []) as Thread[];

  return (
    <main className="page">
      <div className="title-row">
        <h1 className="display">The Back Room</h1>
      </div>
      <p className="muted intro">House rule: what&apos;s said here stays here. Screenshots shared outside the club mean removal.</p>

      <div className="chips" role="group" aria-label="Channels">
        <Link href="/forum" className={`chip${!channel ? ' on' : ''}`}>All</Link>
        {CHANNELS.map((ch) => (
          <Link key={ch.id} href={`/forum?c=${ch.id}`} className={`chip${channel === ch.id ? ' on' : ''}`}>
            # {ch.label}
          </Link>
        ))}
      </div>

      <Link href={channel ? `/forum/new?c=${channel}` : '/forum/new'} className="wbtn wbtn-fill" style={{ margin: '14px 0 16px' }}>
        Start a conversation
      </Link>

      {threads.length === 0 ? (
        <div className="soon">
          <p>Nothing here yet. Be the first to say hello.</p>
        </div>
      ) : (
        <div className="thread-list">
          {threads.map((t) => (
            <Link key={t.id} href={`/forum/${t.id}`} className={`thread-card${t.hidden ? ' is-hidden' : ''}`}>
              <span className="thread-top">
                <span className="thread-channel"># {channelLabel(t.channel)}</span>
                <span className="thread-time">{timeAgo(t.last_activity_at)}</span>
              </span>
              <span className="thread-title">{t.title}</span>
              <span className="thread-excerpt">{t.body}</span>
              <span className="thread-meta">
                {t.reply_count} {t.reply_count === 1 ? 'reply' : 'replies'} · started by {t.author_name ?? 'a member'}
                {t.hidden && ' · removed (only admins see this)'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
