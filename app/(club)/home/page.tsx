import Link from 'next/link';
import { requireApprovedMember } from '../../../lib/member';
import { AFTR_EVENTS, formatDate, isUpcoming } from '../../../lib/events';
import { canUseBackRoom } from '../../../lib/forum';

// Time of day in Accra (GMT, no daylight saving)
function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Accra' }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function Home() {
  const { profile } = await requireApprovedMember();
  const name = profile.display_name?.trim();
  const backRoom = canUseBackRoom(profile);
  const next = AFTR_EVENTS.filter((e) => e.date && isUpcoming(e.date)).slice(0, 2);

  return (
    <main className="page">
      <h1 className="display greeting">
        {greeting()}
        {name ? `, ${name}.` : '.'}
      </h1>
      <p className="muted intro">Here&apos;s what&apos;s coming up at AFTR.</p>

      <div className="home-section-head">
        <span className="eyebrow">Next up</span>
        <Link href="/events" className="inline-link">All events →</Link>
      </div>
      <div className="home-events">
        {next.map((e) => (
          <Link key={e.id} href="/events" className="home-event">
            <span className="home-event-photo" style={{ backgroundImage: e.photo ? `url(${e.photo})` : undefined }} aria-hidden />
            <span>
              <span className="event-date">{formatDate(e.date)}</span>
              <span className="home-event-title">{e.title}</span>
              <span className="home-event-tag">{e.tagline}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="home-section-head">
        <span className="eyebrow">Explore</span>
      </div>
      <div className="home-links">
        <Link href="/gallery" className="home-link"><span className="num">01</span>Gallery<span className="muted">Every AFTR. night so far</span></Link>
        <Link href="/events?tab=around-town" className="home-link"><span className="num">02</span>Around town<span className="muted">What else is on this weekend</span></Link>
        <Link href="/forum" className="home-link">
          <span className="num">03</span>
          <span className="home-link-title">The Back Room{!backRoom && <span className="tag tag-flag">Part of The Club</span>}</span>
          <span className="muted">{backRoom ? 'Members talking now' : 'The members’ forum, with The Club and The Inner Circle'}</span>
        </Link>
        <Link href="/card" className="home-link"><span className="num">04</span>Your card<span className="muted">Show it at the door</span></Link>
      </div>
    </main>
  );
}
