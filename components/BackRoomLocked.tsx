import Link from 'next/link';

// Shown to The Community: the Back Room is part of The Club and The Inner Circle.
export default function BackRoomLocked() {
  return (
    <main className="page">
      <h1 className="display">The Back Room</h1>
      <p className="muted intro">The members&apos; forum: recommendations, plans for the weekend, work, care.</p>
      <div className="soon">
        <div className="label">Part of The Club and The Inner Circle</div>
        <p>
          The Back Room is included with The Club (GHS 275 / year, intro price) and The Inner Circle (GHS 500 / year, intro
          price). Message the AFTR. team to upgrade.
        </p>
      </div>
      <Link href="/card" className="wbtn wbtn-outline" style={{ marginTop: 16 }}>
        See my membership
      </Link>
    </main>
  );
}
