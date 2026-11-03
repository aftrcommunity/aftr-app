import type { Profile } from '../lib/member';
import { todayInAccra } from '../lib/events';

// For paid members: a reminder from 30 days before their membership ends
export default function RenewalNotice({ profile }: { profile: Profile }) {
  if (profile.tier === 'community' || !profile.paid_until || profile.is_team) return null;
  const today = todayInAccra();
  const end = profile.paid_until.slice(0, 10);
  const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (days > 30) return null;
  const date = new Date(`${end}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return (
    <div className={`renewal${days < 0 ? ' ended' : ''}`} role="status">
      <strong>{days < 0 ? 'Your membership has ended' : days === 0 ? 'Your membership ends today' : `Your membership ends in ${days} ${days === 1 ? 'day' : 'days'}`}</strong>
      <span>
        {days < 0 ? `It ended on ${date}.` : `It runs until ${date}.`} To renew, email{' '}
        <a href="mailto:team@aftr.community" className="inline-link">team@aftr.community</a> or message the team.
      </span>
    </div>
  );
}
