import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireApprovedMember } from '../../../../lib/member';
import { canUseBackRoom, timeAgo } from '../../../../lib/forum';
import BackRoomLocked from '../../../../components/BackRoomLocked';
import AutoRefresh from '../../../../components/AutoRefresh';
import SubmitButton from '../../../../components/SubmitButton';
import { sendMessage } from '../../members/actions';

type Msg = { id: number; sender_id: string; body: string; created_at: string; read_at: string | null };

export default async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const id = Number((await params).id);
  if (!id) notFound();

  const { data: conv } = await supabase.from('conversations').select('id, member_a, member_b').eq('id', id).maybeSingle();
  if (!conv) notFound();
  const other = conv.member_a === profile.id ? conv.member_b : conv.member_a;
  const [{ data: rows }, { data: name }, { data: blockedRow }] = await Promise.all([
    supabase.from('messages').select('id, sender_id, body, created_at, read_at').eq('conversation_id', id).order('created_at', { ascending: true }).limit(300),
    supabase.rpc('nickname_of', { member: other }),
    supabase.rpc('is_blocked_between', { x: profile.id, y: other }),
    supabase.rpc('mark_conversation_read', { conv: id }),
  ]);
  const msgs = (rows ?? []) as Msg[];
  const otherName = (name as string) ?? 'A member';
  const blocked = blockedRow === true;
  const lastMine = [...msgs].reverse().find((m) => m.sender_id === profile.id);

  return (
    <main className="page chat-page">
      <AutoRefresh seconds={8} />
      <Link href="/messages" className="back">← Messages</Link>
      <div className="chat-head">
        <h1 className="display" style={{ fontSize: 30 }}>
          {blocked ? otherName : <Link href={`/members/${other}`}>{otherName}</Link>}
        </h1>
      </div>

      <div className="chat-list">
        {msgs.length === 0 && <p className="muted">Say hello. Be kind. What’s shared in the club stays in the club.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === profile.id;
          return (
            <div key={m.id} className={`bubble-row${mine ? ' mine' : ''}`}>
              <div className={`bubble${mine ? ' mine' : ''}`}>
                <p>{m.body}</p>
                <span className="bubble-meta">
                  {timeAgo(m.created_at)}
                  {mine && m.id === lastMine?.id && (m.read_at ? ' · seen' : ' · sent')}
                  {!mine && (
                    <>
                      {' · '}
                      <Link href={`/report?message=${m.id}`} className="bubble-report">Report</Link>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {blocked ? (
        <div className="notice">You can’t send messages in this conversation.</div>
      ) : (
        <form action={sendMessage} className="chat-form">
          <input type="hidden" name="conversation_id" value={id} />
          <label className="field" style={{ flex: 1 }}>
            <span className="label sr-only">Message</span>
            <textarea name="body" required maxLength={2000} rows={2} placeholder={`Message ${otherName}`} />
          </label>
          <SubmitButton className="wbtn wbtn-fill chat-send" pending="…">Send</SubmitButton>
        </form>
      )}
    </main>
  );
}
