import Link from 'next/link';

// Welcome / onboarding screen. The photo is the same hero used on
// aftr.community (images/hero-index.jpg), per Eni.
export default function Welcome() {
  return (
    <main className="welcome">
      <div className="welcome-photo" style={{ backgroundImage: 'url(/images/welcome.jpg)' }} aria-hidden />
      <div className="welcome-scrim" aria-hidden />
      <div className="welcome-body">
        <img className="welcome-logo" src="/images/logo.png" alt="AFTR." />
        <div>
          <div className="eyebrow">A safer space</div>
          <h1 className="display">To dance, connect &amp; belong.</h1>
          <p className="lede">An Accra-based members-only social club for womxn.</p>
        </div>
        <div className="actions">
          <Link className="btn btn-primary" href="/join">
            Join the community →
          </Link>
          {/* Until logins are built this goes straight in, so the screens can be tested */}
          <Link className="btn btn-ghost" href="/home">
            I&apos;m already a member
          </Link>
          <p className="wordmark">AFTR. Community</p>
        </div>
      </div>
    </main>
  );
}
