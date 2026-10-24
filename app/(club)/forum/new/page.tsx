import Link from 'next/link';
import { requireApprovedMember } from '../../../../lib/member';
import { canUseBackRoom, isChannel } from '../../../../lib/forum';
import BackRoomLocked from '../../../../components/BackRoomLocked';
import NewThreadForm from '../../../../components/NewThreadForm';

export default async function NewThread({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const c = (await searchParams).c ?? '';

  return (
    <main className="page">
      <Link href="/forum" className="back">← The Back Room</Link>
      <h1 className="display" style={{ fontSize: 34 }}>Start a conversation</h1>
      <p className="muted intro">Posting as {profile.display_name || 'a member'}. Only members of The Club and The Inner Circle can see this.</p>
      <NewThreadForm defaultChannel={isChannel(c) ? c : 'general'} />
    </main>
  );
}
