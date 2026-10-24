import Link from 'next/link';
import TabBar from '../../components/TabBar';

// Shell for the signed-in part of the app: top bar + tab bar.
// The tier pill is a placeholder until logins and membership tiers are wired up.
export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/home" aria-label="AFTR. home">
          <img src="/images/logo.png" alt="AFTR." />
        </Link>
        <span className="tier-pill">
          Club <span className="initials">NA</span>
        </span>
      </header>
      {children}
      <TabBar />
    </>
  );
}
