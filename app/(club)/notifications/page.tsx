import Link from 'next/link';
import { requireApprovedMember } from '../../../lib/member';
import { timeAgo } from '../../../lib/forum';

type N = {
  id: number; kind: string; actor_name: string | null; thread_id: number | null; conversation_id: number | null;
  title: string | null; excerpt: string | null; created_at: string; read_at: string | null;
};

function line(n: N) {
  const who = n.actor_name ?? 'Someone';
  switch (n.kind) {
    case 'reply': return <><strong>{who}</strong> replied to your post <em>{n.title}</em></>;
    case 'reply_to_reply': return <><strong>{who}</strong> replied to you in <em>{n.title}</em></>;
    case 'reaction': return <><strong>{who}</strong> {n.excerpt} your post in <em>{n.title}</em></>;
    case 'message': return <><strong>{who}</strong> sent you a message</>;
    case 'report_outcome': return <><strong>Your report</strong>: {n.title === 'removed' ? 'we removed it' : 'we kept it up'}</>;
    default: return <>{who}</>;
  }
}

export default async function Notifications() {
  const { supabase } = await requireApprovedMember();
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(60);
  const list = (data ?? []) as N[];
  await supabase.rpc('mark_notifications_read');

  return (
    <main className="page">
      <h1 className="display">Notifications</h1>
      {list.length === 0 ? (
        <div className="soon"><p>Nothing yet. You’ll see replies, reactions, messages and report updates here.</p></div>
      ) : (
        <div className="note-list">
          {list.map((n) => {
            const href = n.conversation_id ? `/messages/${n.conversation_id}` : n.thread_id ? `/forum/${n.thread_id}` : null;
            const body = (
              <>
                <span className="note-line">{line(n)}</span>
                {n.excerpt && n.kind !== 'reaction' && <span className="note-excerpt">{n.excerpt}</span>}
                <span className="thread-time">{timeAgo(n.created_at)}</span>
              </>
            );
            return href ? (
              <Link key={n.id} href={href} className={`note-row${n.read_at ? '' : ' unread'}`}>{body}</Link>
            ) : (
              <div key={n.id} className={`note-row${n.read_at ? '' : ' unread'}`}>{body}</div>
            );
          })}
        </div>
      )}
    </main>
  );
}
