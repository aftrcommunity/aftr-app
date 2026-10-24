'use client';

import { useState } from 'react';

// Membership cards, recreated from Eni's card designs:
//   team         → "Nocturne Classic" (01 · Club · Team business card)
//   inner_circle → "Brushed Silver" (03 · Inner Circle · Metal)
//   club / community → current app cards until their designs arrive
// Tap a card to turn it over.

export type CardData = {
  variant: 'team' | 'inner_circle' | 'club' | 'community';
  name: string;
  memberNo: string; // e.g. "007"
  since: string | null; // year
  title?: string | null; // team
  email?: string | null; // team
  paidUntil?: string | null;
  qrSvg?: string; // team: QR to aftr.community
};

const Logo = ({ dark = false, className = '' }: { dark?: boolean; className?: string }) => (
  <img src="/images/logo-mark.png" alt="AFTR." className={`card-logo${dark ? ' dark' : ''} ${className}`} />
);

function Faces({ c }: { c: CardData }) {
  if (c.variant === 'team') {
    return (
      <>
        <div className="face front team-front">
          <span className="dot lime" />
          <Logo className="logo-centre" />
          <span className="card-tagline">Dance · Connect · Belong</span>
        </div>
        <div className="face back team-back">
          <div className="back-top">
            <div>
              <div className="card-name">{c.name}</div>
              <div className="card-title">{c.title || 'AFTR. Team'}</div>
            </div>
            <Logo dark className="logo-small" />
          </div>
          <div className="back-bottom">
            <div className="card-contact">
              {c.email && <span>{c.email}</span>}
              <span>aftr.community</span>
              <span>@aftrparte</span>
            </div>
            {c.qrSvg && <span className="card-qr" dangerouslySetInnerHTML={{ __html: c.qrSvg }} />}
          </div>
        </div>
      </>
    );
  }

  if (c.variant === 'inner_circle') {
    return (
      <>
        <div className="face front silver">
          <span className="silver-label">Inner Circle</span>
          <span className="dot pink" />
          <Logo dark className="logo-centre" />
          <span className="silver-foot">
            <span>By invitation</span>
            <span>No. {c.memberNo}</span>
          </span>
        </div>
        <div className="face back silver">
          <div className="back-top">
            <div className="silver-title">
              Inner
              <br />
              Circle
            </div>
            <Logo dark className="logo-small" />
          </div>
          <div>
            <div className="silver-name">{c.name}</div>
            <div className="silver-meta">
              <span>No. {c.memberNo}</span>
              {c.since && <span>Since {c.since}</span>}
            </div>
          </div>
          <div className="silver-foot plain">
            <span>aftr.community</span>
            <span>Non-transferable</span>
          </div>
        </div>
      </>
    );
  }

  // The Club and The Community (designs to come)
  const label = c.variant === 'club' ? 'The Club' : 'The Community';
  return (
    <>
      <div className={`face front simple tier-${c.variant}`}>
        <div className="member-card-top">
          <span className="member-chip">Member</span>
          <span className="member-brand">AFTR.</span>
        </div>
        <div className="member-tier">{label}</div>
        <div className="member-name">{c.name}</div>
        <div className="member-meta">
          <span>
            <span className="label">Member no.</span>AFTR-{c.memberNo}
          </span>
          {c.variant === 'club' && (
            <span>
              <span className="label">Paid until</span>
              {c.paidUntil ?? 'Not recorded'}
            </span>
          )}
        </div>
      </div>
      <div className={`face back simple tier-${c.variant}`}>
        <div className="member-card-top">
          <span className="member-brand">AFTR.</span>
        </div>
        <div className="simple-back">
          <span>{label}</span>
          <span>aftr.community · Non-transferable</span>
        </div>
      </div>
    </>
  );
}

export default function MemberCard({ card }: { card: CardData }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className={`flip-card${flipped ? ' flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
      aria-label={`${card.name}'s card. Tap to turn over.`}
    >
      <span className="flip-inner">
        <Faces c={card} />
      </span>
    </button>
  );
}
