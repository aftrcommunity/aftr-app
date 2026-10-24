import Link from 'next/link';
import { CHANNELS } from '../lib/forum';

const ABOUT: Record<string, string> = {
  general: 'Say hello, share news, ask the room',
  events: 'Who’s going, outfits, sharing rides',
  'rooms-recs': 'Places, services and people members trust',
  work: 'Jobs, collaborations, getting paid properly',
  care: 'Support, advice and checking in on each other',
};

// Shown to The Community: they can see the Back Room exists and what's in it,
// but not the conversations. The database blocks them from reading posts too.
export default function BackRoomLocked() {
  return (
    <main className="page">
      <h1 className="display">The Back Room</h1>
      <p className="muted intro">The members&apos; forum. House rule: what&apos;s said here stays here.</p>

      <div className="locked-card">
        <div className="locked-head">
          <svg viewBox="0 0 12 14" width="16" height="18" aria-hidden>
            <rect x="1" y="6" width="10" height="7.5" rx="1.8" fill="currentColor" />
            <path d="M3.2 6V4.4a2.8 2.8 0 0 1 5.6 0V6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="label">Part of The Club and The Inner Circle</span>
        </div>
        <p>Where members on The Club and The Inner Circle swap recommendations, plan nights out and look out for each other. Upgrade to join the conversation.</p>
        <ul className="locked-channels">
          {CHANNELS.map((c) => (
            <li key={c.id}>
              <span className="thread-channel"># {c.label}</span>
              <span>{ABOUT[c.id]}</span>
            </li>
          ))}
        </ul>
        <div className="locked-tiers">
          <span><strong>The Club</strong> GHS 275 / year · intro price</span>
          <span><strong>The Inner Circle</strong> GHS 500 / year · intro price</span>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 14 }}>To upgrade, message the AFTR. team. Your card updates as soon as it&apos;s confirmed.</p>
      <Link href="/card" className="wbtn wbtn-outline" style={{ marginTop: 14 }}>
        See my membership
      </Link>
    </main>
  );
}
