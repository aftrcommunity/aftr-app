import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireApprovedMember } from '../../../lib/member';
import { canUseBackRoom } from '../../../lib/forum';
import BackRoomLocked from '../../../components/BackRoomLocked';
import ReportForm from '../../../components/ReportForm';
import SubmitButton from '../../../components/SubmitButton';
import { block, mute } from '../members/actions';

type Search = { thread?: string; reply?: string; message?: string; profile?: string; done?: string };

export default async function Report({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const q = await searchParams;
  const thread = Number(q.thread || 0);
  const reply = Number(q.reply || 0);
  const message = Number(q.message || 0);
  const member = q.profile ?? '';

  // What's being reported, so the member can see exactly which one
  let kind = 'post';
  let excerpt = '';
  let who: { id: string; name: string } | null = null;
  let backTo = '/forum';
  const target: Record<string, string> = {};
  if (message) {
    const { data: m } = await supabase.from('messages').select('id, body, sender_id, conversation_id').eq('id', message).maybeSingle();
    if (!m) notFound();
    const { data: name } = await supabase.rpc('nickname_of', { member: m.sender_id });
    kind = 'message';
    excerpt = m.body;
    who = { id: m.sender_id, name: (name as string) ?? 'this member' };
    backTo = `/messages/${m.conversation_id}`;
    target.message_id = String(m.id);
  } else if (reply) {
    const { data: r } = await supabase.from('forum_replies').select('id, body, author_id, author_name, thread_id').eq('id', reply).maybeSingle();
    if (!r) notFound();
    kind = 'reply';
    excerpt = r.body;
    who = { id: r.author_id, name: r.author_name ?? 'this member' };
    backTo = `/forum/${r.thread_id}#reply-${r.id}`;
    target.reply_id = String(r.id);
    target.thread_id = String(r.thread_id);
  } else if (thread) {
    const { data: t } = await supabase.from('forum_threads').select('id, title, body, author_id, author_name').eq('id', thread).maybeSingle();
    if (!t) notFound();
    excerpt = `${t.title}\n${t.body}`;
    who = { id: t.author_id, name: t.author_name ?? 'this member' };
    backTo = `/forum/${t.id}`;
    target.thread_id = String(t.id);
  } else if (member) {
    const { data: rows } = await supabase.rpc('member_profile', { member });
    const p = (rows ?? [])[0] as { id: string; display_name: string; bio: string | null } | undefined;
    if (!p) notFound();
    kind = 'profile';
    excerpt = p.bio ?? '';
    who = { id: p.id, name: p.display_name };
    backTo = `/members/${p.id}`;
    target.profile_id = p.id;
  } else notFound();

  const query = new URLSearchParams(Object.entries(q).filter(([k, v]) => k !== 'done' && typeof v === 'string') as [string, string][]).toString();

  if (q.done) {
    return (
      <main className="page">
        <h1 className="display">Thanks for telling us</h1>
        <div className="notice" style={{ marginTop: 14 }}>
          <p style={{ margin: 0 }}>
            The AFTR. team will review this against the <strong>Safer Spaces Policy</strong>, usually within 48 hours. If it
            breaks the policy we’ll remove it. Either way, we’ll let you know what we decided in your notifications.
          </p>
        </div>
        {who && who.id !== profile.id && (
          <>
            <p className="muted" style={{ marginTop: 18 }}>You don’t have to wait for us. You can also:</p>
            <div className="stack-actions">
              <form action={mute}>
                <input type="hidden" name="member" value={who.id} />
                <input type="hidden" name="back" value={backTo.split('#')[0]} />
                <SubmitButton className="wbtn wbtn-outline" pending="Muting…">Mute {who.name}</SubmitButton>
              </form>
              <p className="muted">You won’t see their posts or replies. They won’t be told.</p>
              <form action={block}>
                <input type="hidden" name="member" value={who.id} />
                <input type="hidden" name="back" value="/forum" />
                <SubmitButton className="wbtn wbtn-outline" pending="Blocking…">Block {who.name}</SubmitButton>
              </form>
              <p className="muted">As mute, and you can’t message each other or see each other’s profiles.</p>
            </div>
          </>
        )}
        <Link href={backTo} className="wbtn wbtn-fill" style={{ marginTop: 18 }}>Done</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <Link href={backTo} className="back">← Back</Link>
      <h1 className="display">Report {kind === 'profile' ? 'a profile' : `this ${kind}`}</h1>
      {who && <p className="muted intro">From {who.name}</p>}
      {excerpt && <blockquote className="report-quote">{excerpt.length > 400 ? `${excerpt.slice(0, 400)}…` : excerpt}</blockquote>}
      <ReportForm target={target} query={query} />
    </main>
  );
}
