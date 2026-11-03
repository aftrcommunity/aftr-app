// Emails sent by the app (welcome and renewal reminders) go through Resend.
// Needs RESEND_API_KEY in Vercel's environment variables (never in the code).
// The sender must be on a domain verified in Resend, e.g. team@aftr.community.

const FROM = process.env.EMAIL_FROM || 'AFTR. <team@aftr.community>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aftr-app-opal.vercel.app';

export const emailReady = () => !!process.env.RESEND_API_KEY;

async function send(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'Email isn’t set up yet (RESEND_API_KEY is missing in Vercel).' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: 'team@aftr.community', subject, text }),
  });
  if (!res.ok) return { ok: false, error: `Email failed (${res.status}): ${(await res.text()).slice(0, 200)}` };
  return { ok: true as const };
}

const TIER: Record<string, string> = { community: 'The Community', club: 'The Club', inner_circle: 'The Inner Circle' };
const day = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function sendWelcome(to: string, name: string | null, tier: string) {
  const hi = name ? `Hi ${name},` : 'Hi,';
  return send(
    to,
    'Welcome to AFTR.',
    `${hi}

You're in. Welcome to AFTR., as a member of ${TIER[tier] ?? 'The Community'}.

Open the app to see what's coming up and to find your membership card:
${APP_URL}

Sign in with this email address. We'll send you a code each time.

A reminder of our house rule: what's shared in the club stays in the club.

See you soon,
The AFTR. team
team@aftr.community`,
  );
}

export function sendRenewalReminder(to: string, name: string | null, tier: string, paidUntil: string) {
  const hi = name ? `Hi ${name},` : 'Hi,';
  const ended = paidUntil < new Date().toISOString().slice(0, 10);
  return send(
    to,
    ended ? 'Your AFTR. membership has ended' : 'Your AFTR. membership is due for renewal',
    `${hi}

${ended ? `Your ${TIER[tier] ?? ''} membership ended on ${day(paidUntil)}.` : `Your ${TIER[tier] ?? ''} membership runs until ${day(paidUntil)}.`}

To renew, reply to this email or message the team, and we'll send you the payment details.

Thank you for being part of AFTR.
The AFTR. team
team@aftr.community`,
  );
}
