import Link from 'next/link';
import { requireApprovedMember, TIER_LABEL, type Tier } from '../../../../lib/member';
import { canUseBackRoom } from '../../../../lib/forum';
import { photoLinks, type Photo } from '../../../../lib/media';
import BackRoomLocked from '../../../../components/BackRoomLocked';
import PhotoGrid from '../../../../components/PhotoGrid';
import SubmitButton from '../../../../components/SubmitButton';
import { block, mute, startConversation } from '../actions';

type P = {
  id: string; display_name: string; tier: Tier; is_team: boolean; team_title: string | null; member_number: number;
  approved_at: string | null; bio: string | null; instagram: string | null; photos: string[]; allow_messages: boolean;
};

export default async function MemberProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const id = (await params).id;
  const error = (await searchParams).error;

  const [{ data: rows }, { data: muted }, { data: blocked }] = await Promise.all([
    supabase.rpc('member_profile', { member: id }),
    supabase.from('member_mutes').select('muted_id').eq('muted_id', id).maybeSingle(),
    supabase.from('member_blocks').select('blocked_id').eq('blocked_id', id).maybeSingle(),
  ]);
  const p = ((rows ?? []) as P[])[0];
  const me = id === profile.id;

  if (!p) {
    return (
      <main className="page">
        <Link href="/members" className="back">← Members</Link>
        <h1 className="display">Profile</h1>
        <div className="soon">
          <p>{blocked ? 'You’ve blocked this member.' : 'This profile isn’t available.'}</p>
        </div>
        {blocked && (
          <form action={block} style={{ marginTop: 14 }}>
            <input type="hidden" name="member" value={id} />
            <input type="hidden" name="undo" value="1" />
            <input type="hidden" name="back" value={`/members/${id}`} />
            <SubmitButton className="wbtn wbtn-outline" pending="Unblocking…">Unblock</SubmitButton>
          </form>
        )}
      </main>
    );
  }

  const links = await photoLinks(supabase, p.photos);
  const photos = p.photos.map((x) => links.get(x)).filter((x): x is Photo => !!x);
  const since = p.approved_at ? new Date(p.approved_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Africa/Accra' }) : null;

  return (
    <main className="page">
      <Link href="/members" className="back">← Members</Link>
      <div className="profile-head">
        <span className="profile-avatar" style={photos[0] ? { backgroundImage: `url(${photos[0].small})` } : undefined} aria-hidden>
          {!photos[0] && p.display_name.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="display profile-name">{p.display_name}</h1>
          <div className="profile-tags">
            {p.is_team && <span className="team-badge" style={{ marginLeft: 0 }}>Team</span>}
            {p.is_team && p.team_title && <span className="muted">{p.team_title}</span>}
            {!p.is_team && <span className="tag">{TIER_LABEL[p.tier]}</span>}
          </div>
          {since && <div className="muted">Member since {since}</div>}
        </div>
      </div>

      {p.bio && <p className="profile-bio">{p.bio}</p>}
      {p.instagram && (
        <a className="inline-link" href={`https://instagram.com/${encodeURIComponent(p.instagram)}`} target="_blank" rel="noopener noreferrer">
          @{p.instagram} on Instagram ↗
        </a>
      )}
      <PhotoGrid photos={photos} label={`${p.display_name}’s photo`} variant="profile" />
      {photos.length === 0 && !p.bio && <p className="muted" style={{ marginTop: 14 }}>{me ? 'Your profile is empty. Add a photo and a few words.' : 'No photos or bio yet.'}</p>}

      {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}
      <div className="stack-actions">
        {me ? (
          <Link href="/profile" className="wbtn wbtn-fill">Edit your profile</Link>
        ) : (
          <>
            {p.allow_messages ? (
              <form action={startConversation}>
                <input type="hidden" name="member" value={p.id} />
                <SubmitButton pending="Opening…">Message {p.display_name}</SubmitButton>
              </form>
            ) : (
              <p className="muted">{p.display_name} isn’t taking messages right now.</p>
            )}
            <div className="row-actions">
              <form action={mute}>
                <input type="hidden" name="member" value={p.id} />
                {muted && <input type="hidden" name="undo" value="1" />}
                <input type="hidden" name="back" value={`/members/${p.id}`} />
                <SubmitButton className="tool-btn" pending="…">{muted ? 'Unmute' : 'Mute'}</SubmitButton>
              </form>
              <form action={block}>
                <input type="hidden" name="member" value={p.id} />
                <input type="hidden" name="back" value={`/members/${p.id}`} />
                <SubmitButton className="tool-btn" pending="…">Block</SubmitButton>
              </form>
              <Link href={`/report?profile=${p.id}`} className="tool-btn tool-link">Report</Link>
            </div>
            <p className="muted">
              Mute hides their posts from you. Block also stops messages both ways and hides your profiles from each other.
              Neither person is told.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
