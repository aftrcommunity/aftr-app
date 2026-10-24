import Link from 'next/link';

// Welcome / onboarding screen — mirrors the aftr.community home hero:
// same photo (images/hero-index.jpg), scrim, fonts, copy and layout.
// The only addition is "I'm already a member", which the app needs.
export default function Welcome() {
  return (
    <main className="welcome" style={{ backgroundImage: 'url(/images/welcome.jpg)' }}>
      <img className="welcome-logo" src="/images/logo.png" alt="AFTR." />
      <div className="welcome-content">
        <span className="hero-eyebrow">A Safer Space</span>
        <h1>
          To Dance
          <br />
          Connect &amp;
          <br />
          Belong.
        </h1>
        <p className="hero-body">An Accra-based members-only social club for womxn.</p>
        <div className="welcome-actions">
          <Link className="site-btn btn-fill" href="/join">
            Join the community →
          </Link>
          {/* Until logins are built this goes straight in, so the screens can be tested */}
          <Link className="site-btn btn-outline" href="/home">
            I&apos;m already a member
          </Link>
        </div>
      </div>
      <div className="hero-wordmark">AFTR. Community</div>
    </main>
  );
}
