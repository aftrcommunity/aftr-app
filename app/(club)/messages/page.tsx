import Link from 'next/link';
import { requireApprovedMember } from '../../../lib/member';
import { canUseBackRoom, timeAgo } from '../../../lib/forum';
import { photoLinks } from '../../../lib/media';
import BackRoomLocked from '../../../components/BackRoomLocked';

type Conv = { id: number; other_id: string; other_name: string; other_photo: string | null; last_body: string; last_at: string; last_from_me: boolean; unread: number };

export default async function Messages() {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const { data } = await supabase.rpc('my_conversations');
  const convs = (data ?? []) as Conv[];
  const photos = await photoLinks(supabase, convs.map((c) => c.other_photo ?? ''));

  return (
    <main className="page">
      <Link href="/forum" className="back">← The Back Room</Link>
      <h1 className="display">Messages</h1>
      <p className="muted intro">Private between you and the other member. The AFTR. team can only see a message if it’s reported to them.</p>
      {convs.length === 0 ? (
        <div className="soon">
          <p>No messages yet. Open someone’s profile from <Link href="/members" className="inline-link">Members</Link> to send them a message.</p>
        </div>
      ) : (
        <div className="conv-list">
          {convs.map((c) => {
            const p = c.other_photo ? photos.get(c.other_photo) : undefined;
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className={`conv-row${Number(c.unread) ? ' unread' : ''}`}>
                <span className="member-photo small" style={p ? { backgroundImage: `url(${p.small})` } : undefined} aria-hidden>
                  {!p && c.other_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="conv-text">
                  <span className="conv-top">
                    <strong>{c.other_name}</strong>
                    <span className="thread-time">{timeAgo(c.last_at)}</span>
                  </span>
                  <span className="conv-last">{c.last_from_me ? 'You: ' : ''}{c.last_body}</span>
                </span>
                {Number(c.unread) > 0 && <span className="count-dot">{c.unread}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
