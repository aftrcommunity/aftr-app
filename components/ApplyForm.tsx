'use client';

import { useActionState } from 'react';
import { submitApplication, type ApplyState } from '../app/apply/actions';

export default function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, {});

  return (
    <form className="form" action={action}>
      <label className="field">
        <span className="label">Your name</span>
        <input name="full_name" required maxLength={80} autoComplete="name" placeholder="First and last name" />
        <span className="hint">Only the team sees this.</span>
      </label>
      <label className="field">
        <span className="label">What should members call you?</span>
        <input name="display_name" maxLength={40} placeholder="A first name or nickname" />
        <span className="hint">This is what other members see. Leave blank to decide later.</span>
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
