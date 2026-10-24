'use client';

import { useActionState } from 'react';
import { submitApplication, type ApplyState } from '../app/apply/actions';
import { TIERS } from '../lib/tiers';

export default function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, {});

  return (
    <form className="form" action={action}>
      <fieldset className="tier-choice">
        <legend className="label">Choose your membership</legend>
        {TIERS.map((t, i) => (
          <label key={t.id} className="tier-option">
            <input type="radio" name="requested_tier" value={t.id} defaultChecked={i === 0} required />
            <span className="tier-box">
              <span className="tier-top">
                <span className="tier-name">{t.name}</span>
                <span className="tier-price">
                  {t.price}
                  {t.note && <span className="tier-note">{t.note}</span>}
                </span>
              </span>
              <span className="tier-perks">{t.perks.join(' · ')}</span>
            </span>
          </label>
        ))}
        <span className="hint">Paid memberships are paid after you&apos;re approved. We&apos;ll send you the details.</span>
      </fieldset>
      <label className="field">
        <span className="label">Your name</span>
        <input name="full_name" required maxLength={80} autoComplete="name" placeholder="First and last name" />
        <span className="hint">Only the team sees this.</span>
      </label>
      <label className="field">
        <span className="label">Your nickname</span>
        <input name="display_name" required maxLength={40} placeholder="What should we call you?" />
        <span className="hint">This is what other members see, and how the app greets you.</span>
      </label>
      <label className="field">
        <span className="label">Phone or WhatsApp</span>
        <input name="contact" required maxLength={80} inputMode="tel" autoComplete="tel" placeholder="+233…" />
      </label>
      <label className="field">
        <span className="label">Instagram (optional)</span>
        <input name="instagram" maxLength={60} placeholder="@handle" />
      </label>
      <label className="field">
        <span className="label">Who told you about AFTR.? (optional)</span>
        <input name="referred_by" maxLength={80} placeholder="A member’s name, an event, a friend" />
      </label>
      <label className="field">
        <span className="label">Why would you like to join?</span>
        <textarea name="why_aftr" required minLength={10} maxLength={1000} rows={4} placeholder="A sentence or two is plenty." />
      </label>
      <label className="check">
        <input type="checkbox" name="agree" value="yes" required />
        <span>
          I&apos;ve read and agree to the{' '}
          <a href="https://aftr.community/safer-spaces-policy.html" target="_blank" rel="noopener noreferrer" className="inline-link">
            Safer Spaces Policy
          </a>
          , including keeping what&apos;s shared in the club inside the club.
        </span>
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="wbtn wbtn-fill" disabled={pending}>
        {pending ? 'Sending…' : 'Send my application →'}
      </button>
    </form>
  );
}
