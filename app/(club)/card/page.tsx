import Link from 'next/link';
import { requireApprovedMember, TIER_LABEL } from '../../../lib/member';

const fmt = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null;

export default async function Card() {
  const { profile, user } = await requireApprovedMember();
  const paid = fmt(profile.paid_until);

  return (
    <main className="page">
      <h1 className="display">Membership</h1>
      <p className="muted intro">Show this at the door.</p>
      <div className={`member-card tier-${profile.tier}`}>
        <div className="member-card-top">
          <span className="member-chip">Member</span>
          <span className="member-brand">AFTR.</span>
        </div>
        <div className="member-tier">{TIER_LABEL[profile.tier]}</div>
        <div className="member-name">{profile.display_name || user!.email}</div>
        <div className="member-meta">
          <span>
            <span className="label">Member no.</span>AFTR-{String(profile.member_number).padStart(4, '0')}
          </span>
          {profile.tier !== 'community' && (
            <span>
              <span className="label">Paid until</span>
              {paid ?? 'Not recorded'}
            </span>
          )}
        </div>
      </div>
      <div className="soon">
        <div className="label">Coming in the beta</div>
        <p>A QR code for the door, and your tickets.</p>
      </div>
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
