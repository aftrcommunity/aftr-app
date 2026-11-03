import Link from 'next/link';
import TabBar from '../../components/TabBar';
import { requireApprovedMember, initials, TIER_LABEL } from '../../lib/member';
import { canUseBackRoom } from '../../lib/forum';

// Checked on every visit: never pre-built, never cached.
export const dynamic = 'force-dynamic';

// Shell for the members-only part of the app: top bar + tab bar.
// Anyone who isn't an approved member is sent to sign in, apply, or the waiting screen.
export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireApprovedMember();
  const tier = TIER_LABEL[profile.tier].replace('The ', '');
  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);

  return (
    <>
      <header className="topbar">
        <Link href="/home" aria-label="AFTR. home">
          <img src="/images/logo.png" alt="AFTR." />
        </Link>
        <div className="topbar-right">
          <Link href="/notifications" className="bell" aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path d="M12 3a6 6 0 0 0-6 6v3.6L4.4 16h15.2L18 12.6V9a6 6 0 0 0-6-6Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M9.5 19a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {unread ? <span className="bell-dot">{unread > 9 ? '9+' : unread}</span> : null}
          </Link>
          <Link href="/card" className="tier-pill">
            {tier} <span className="initials">{initials(profile.display_name)}</span>
          </Link>
        </div>
      </header>
      {children}
      <TabBar backRoomLocked={!canUseBackRoom(profile)} />
    </>
  );
}
