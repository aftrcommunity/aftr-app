import Link from 'next/link';
import TabBar from '../../components/TabBar';
import { requireApprovedMember, initials, TIER_LABEL } from '../../lib/member';
import { canUseBackRoom } from '../../lib/forum';

// Checked on every visit: never pre-built, never cached.
export const dynamic = 'force-dynamic';

// Shell for the members-only part of the app: top bar + tab bar.
// Anyone who isn't an approved member is sent to sign in, apply, or the waiting screen.
export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireApprovedMember();
  const tier = TIER_LABEL[profile.tier].replace('The ', '');

  return (
    <>
      <header className="topbar">
        <Link href="/home" aria-label="AFTR. home">
          <img src="/images/logo.png" alt="AFTR." />
        </Link>
        <Link href="/card" className="tier-pill">
          {tier} <span className="initials">{initials(profile.display_name)}</span>
        </Link>
      </header>
      {children}
      <TabBar backRoomLocked={!canUseBackRoom(profile)} />
    </>
  );
}
