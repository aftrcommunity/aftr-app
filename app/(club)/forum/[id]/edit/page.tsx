import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireApprovedMember } from '../../../../../lib/member';
import { canUseBackRoom } from '../../../../../lib/forum';
import BackRoomLocked from '../../../../../components/BackRoomLocked';
import EditPostForm from '../../../../../components/EditPostForm';

export default async function EditPost({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reply?: string }>;
}) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const threadId = Number((await params).id);
  const replyId = Number((await searchParams).reply || 0) || undefined;

  const { data } = replyId
    ? await supabase.from('forum_replies').select('id, body, author_id').eq('id', replyId).maybeSingle()
    : await supabase.from('forum_threads').select('id, title, body, author_id').eq('id', threadId).maybeSingle();
  if (!data || data.author_id !== profile.id) notFound();

  return (
    <main className="page">
      <Link href={`/forum/${threadId}`} className="back">← Back to the conversation</Link>
      <h1 className="display">{replyId ? 'Edit reply' : 'Edit post'}</h1>
      <EditPostForm
        threadId={threadId}
        replyId={replyId}
        title={'title' in data ? (data.title as string) : undefined}
        body={data.body as string}
      />
    </main>
  );
}
