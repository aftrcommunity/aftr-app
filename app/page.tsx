import Link from 'next/link';

// Welcome / onboarding screen. Layout follows the Claude Design onboarding
// screen; the photo is the aftr.community home hero (images/hero-index.jpg)
// and the fonts are the website's own.
export default function Welcome() {
  return (
    <main className="welcome">
      <div className="welcome-photo" style={{ backgroundImage: 'url(/images/welcome.jpg)' }} aria-hidden />
      <div className="welcome-scrim" aria-hidden />
      <div className="welcome-body">
        <img className="welcome-logo" src="/images/logo.png" alt="AFTR." />
        <div>
          <span className="hero-eyebrow">A safer space</span>
          <h1>To dance, connect &amp; belong.</h1>
          <p className="hero-body">An Accra-based members-only social club for women.</p>
        </div>
        <div className="welcome-actions">
          <Link className="wbtn wbtn-fill" href="/join">
            Join the community →
          </Link>
          <Link className="wbtn wbtn-outline" href="/login">
            I&apos;m already a member
          </Link>
          <p className="hero-wordmark">AFTR. Community</p>
        </div>
      </div>
    </main>
  );
}
