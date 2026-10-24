import Link from 'next/link';

export default function Join() {
  return (
    <main className="page" style={{ paddingTop: 'calc(40px + var(--safe-top))' }}>
      <Link href="/" className="back">← Back</Link>
      <h1 className="display">Join the community.</h1>
      <p className="muted intro">Membership is by application. Every application is read by a person on the team.</p>
      <div className="soon">
        <div className="label">Coming in the beta</div>
        <p>The application form goes here: your details, who referred you, why AFTR., and agreeing to the Safer Spaces Policy.</p>
      </div>
    </main>
  );
}
