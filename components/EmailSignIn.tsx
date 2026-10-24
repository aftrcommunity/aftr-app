'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../lib/supabase/client';

// Passwordless sign-in: we email a link (and a 6–8 digit code, if the email
// template includes it). The code helps when the app is installed on the
// home screen, where tapping an email link opens the browser instead.
export default function EmailSignIn({ mode }: { mode: 'join' | 'login' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: mode === 'join',
      },
    });
    setBusy(false);
    if (error) {
      setError(
        mode === 'login' && /signup|not allowed|not found/i.test(error.message)
          ? "We couldn't find a membership with that email. New here? Join the community instead."
          : 'That didn’t go through. Check the email address and try again in a minute.',
      );
      return;
    }
    setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) return setError('That code didn’t work. Check it, or use the link in the email.');
    router.replace('/auth/route');
    router.refresh();
  }

  if (sent) {
    return (
      <form className="form" onSubmit={verify}>
        <div className="notice">
          <strong>Check your email.</strong> We sent a sign-in link to {email}. Tap it on this phone, or enter the code from
          the email below.
        </div>
        <label className="field">
          <span className="label">Code from the email</span>
          <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="12345678" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="wbtn wbtn-fill" disabled={busy || code.length < 6}>
          {busy ? 'Checking…' : 'Sign in with code'}
        </button>
        <button type="button" className="link-btn" onClick={() => setSent(false)}>
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form className="form" onSubmit={send}>
      <label className="field">
        <span className="label">Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="wbtn wbtn-fill" disabled={busy}>
        {busy ? 'Sending…' : mode === 'join' ? 'Send my sign-in link →' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
