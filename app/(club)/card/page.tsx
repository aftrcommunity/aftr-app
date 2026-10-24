import Link from 'next/link';
import QRCode from 'qrcode';
import { requireApprovedMember } from '../../../lib/member';
import MemberCard, { type CardData } from '../../../components/MemberCard';

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null;

export default async function Card() {
  const { profile, user, supabase } = await requireApprovedMember();
  const { data: fullName } = await supabase.rpc('my_full_name');

  const name = (typeof fullName === 'string' && fullName.trim()) || profile.display_name || user!.email || 'Member';
  const memberNo = String(profile.member_number).padStart(3, '0');
  const since = profile.approved_at ? String(new Date(profile.approved_at).getUTCFullYear()) : null;

  const cards: { heading: string; card: CardData }[] = [];
  if (profile.is_team) {
    const qrSvg = await QRCode.toString('https://aftr.community', {
      type: 'svg',
      margin: 0,
      color: { dark: '#1d1524', light: '#0000' },
    });
    cards.push({
      heading: 'AFTR. team',
      card: { variant: 'team', name, memberNo, since, title: profile.team_title, email: profile.team_email, qrSvg },
    });
  }
  cards.push({
    heading: profile.is_team ? 'Your membership' : '',
    card: { variant: profile.tier, name, memberNo, since, paidUntil: fmt(profile.paid_until) },
  });

  return (
    <main className="page">
      <h1 className="display">Membership</h1>
      <p className="muted intro">Show this at the door. Tap a card to turn it over.</p>

      {cards.map((c) => (
        <section key={c.card.variant} className="card-section">
          {c.heading && <div className="label card-heading">{c.heading}</div>}
          <MemberCard card={c.card} />
        </section>
      ))}

      {profile.tier !== 'community' && (
        <p className="muted" style={{ marginTop: 4 }}>Paid until {fmt(profile.paid_until) ?? 'not recorded yet'}.</p>
      )}

      {profile.is_admin && (
        <Link href="/admin" className="wbtn wbtn-fill" style={{ marginTop: 18 }}>
          Open the review queue →
        </Link>
      )}
      <form action="/auth/signout" method="post" style={{ marginTop: 12 }}>
        <button className="wbtn wbtn-outline">Sign out</button>
      </form>
    </main>
  );
}
