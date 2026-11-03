import Link from 'next/link';
import { requireApprovedMember, TIER_LABEL, type Tier } from '../../../lib/member';
import { canUseBackRoom } from '../../../lib/forum';
import { photoLinks } from '../../../lib/media';
import BackRoomLocked from '../../../components/BackRoomLocked';

type Row = { id: string; display_name: string; tier: Tier; is_team: boolean; team_title: string | null; photo: string | null };

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'team', label: 'Team' },
  { id: 'inner_circle', label: 'The Inner Circle' },
  { id: 'club', label: 'The Club' },
] as const;

export default async function Members({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { supabase, profile } = await requireApprovedMember();
  if (!canUseBackRoom(profile)) return <BackRoomLocked />;
  const want = (await searchParams).t;
  const t = TABS.find((x) => x.id === want)?.id ?? 'all';

  const { data } = await supabase.rpc('member_directory');
  const all = (data ?? []) as Row[];
  const rows = all.filter((r) => (t === 'all' ? true : t === 'team' ? r.is_team : r.tier === t && !r.is_team));
  const photos = await photoLinks(supabase, rows.map((r) => r.photo ?? ''));
  const count = (id: string) => all.filter((r) => (id === 'all' ? true : id === 'team' ? r.is_team : r.tier === id && !r.is_team)).length;

  return (
    <main className="page">
      <Link href="/forum" className="back">← The Back Room</Link>
      <h1 className="display">Members</h1>
      <p className="muted intro">Members of The Club, The Inner Circle and the team. Tap someone to see their profile or message them.</p>
      <div className="chips" role="group" aria-label="Show">
        {TABS.map((x) => (
          <Link key={x.id} href={x.id === 'all' ? '/members' : `/members?t=${x.id}`} className={`chip${t === x.id ? ' on' : ''}`}>
            {x.label} ({count(x.id)})
          </Link>
        ))}
      </div>
      <div className="member-grid">
        {rows.map((r) => {
          const p = r.photo ? photos.get(r.photo) : undefined;
          return (
            <Link key={r.id} href={`/members/${r.id}`} className="member-tile">
              <span className="member-photo" style={p ? { backgroundImage: `url(${p.small})` } : undefined} aria-hidden>
                {!p && r.display_name.slice(0, 1).toUpperCase()}
              </span>
              <span className="member-tile-name">{r.display_name}{r.id === profile.id && ' (you)'}</span>
              <span className="member-tile-tier">
                {r.is_team ? <span className="team-badge" style={{ marginLeft: 0 }}>Team</span> : TIER_LABEL[r.tier].replace('The ', '')}
                {r.is_team && r.team_title && <span> {r.team_title}</span>}
              </span>
            </Link>
          );
        })}
      </div>
      {rows.length === 0 && <div className="soon"><p>Nobody here yet.</p></div>}
    </main>
  );
}
