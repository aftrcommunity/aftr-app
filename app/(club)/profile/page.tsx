import Link from 'next/link';
import { requireApprovedMember } from '../../../lib/member';
import { canUseBackRoom } from '../../../lib/forum';
import { photoLinks } from '../../../lib/media';
import BackRoomLocked from '../../../components/BackRoomLocked';
import ProfileForm from '../../../components/ProfileForm';
import SubmitButton from '../../../components/SubmitButton';
import { block, mute } from '../members/actions';

export default async function MyProfile() {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;

  const [{ data: mp }, { data: mutes }, { data: blocks }] = await Promise.all([
    supabase.from('member_profiles').select('*').eq('id', profile.id).maybeSingle(),
    supabase.from('member_mutes').select('muted_id'),
    supabase.from('member_blocks').select('blocked_id'),
  ]);
  const paths = (mp?.photos ?? []) as string[];
  const links = await photoLinks(supabase, paths);
  const names = async (ids: string[]) =>
    Promise.all(ids.map(async (id) => ({ id, name: ((await supabase.rpc('nickname_of', { member: id })).data as string) ?? 'A member' })));
  const [muted, blocked] = await Promise.all([
    names((mutes ?? []).map((m) => m.muted_id as string)),
    names((blocks ?? []).map((b) => b.blocked_id as string)),
  ]);

  return (
    <main className="page">
      <Link href={`/members/${profile.id}`} className="back">← See your profile</Link>
      <h1 className="display">Your profile</h1>
      <p className="muted intro">Seen by members of The Club, The Inner Circle and the team. Not by anyone you’ve blocked.</p>
      <ProfileForm
        userId={profile.id}
        nickname={profile.display_name ?? ''}
        bio={mp?.bio ?? ''}
        instagram={mp?.instagram ?? ''}
        listed={mp?.listed ?? true}
        allowMessages={mp?.allow_messages ?? true}
        photos={paths.filter((p) => links.has(p)).map((p) => ({ path: p, preview: links.get(p)!.small }))}
      />

      <h2 className="eyebrow" style={{ margin: '30px 0 10px' }}>Muted and blocked</h2>
      {muted.length + blocked.length === 0 ? (
        <p className="muted">Nobody. You can mute or block someone from their posts, messages or profile.</p>
      ) : (
        <div className="people-list">
          {muted.map((m) => (
            <form key={`m${m.id}`} action={mute} className="people-row">
              <input type="hidden" name="member" value={m.id} />
              <input type="hidden" name="undo" value="1" />
              <input type="hidden" name="back" value="/profile" />
              <span>{m.name} <span className="muted">· muted</span></span>
              <SubmitButton className="tool-btn" pending="…">Unmute</SubmitButton>
            </form>
          ))}
          {blocked.map((b) => (
            <form key={`b${b.id}`} action={block} className="people-row">
              <input type="hidden" name="member" value={b.id} />
              <input type="hidden" name="undo" value="1" />
              <input type="hidden" name="back" value="/profile" />
              <span>{b.name} <span className="muted">· blocked</span></span>
              <SubmitButton className="tool-btn" pending="…">Unblock</SubmitButton>
            </form>
          ))}
        </div>
      )}
    </main>
  );
}
