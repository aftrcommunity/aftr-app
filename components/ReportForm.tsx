'use client';

import { useActionState } from 'react';
import { submitReport, type PostState } from '../app/(club)/forum/actions';
import { REPORT_CATEGORIES } from '../lib/forum';
import SubmitButton from './SubmitButton';

export default function ReportForm({ target, query }: { target: Record<string, string>; query: string }) {
  const [state, action] = useActionState<PostState, FormData>(submitReport, {});
  return (
    <form className="form" action={action}>
      {Object.entries(target).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="query" value={query} />
      <fieldset className="report-choices">
        <legend className="label">What’s the problem? (choose one)</legend>
        {REPORT_CATEGORIES.map((c) => (
          <label key={c.id} className="report-option">
            <input type="radio" name="category" value={c.id} required />
            <span className="report-box">
              <span className="report-name">{c.label}</span>
              <span className="report-detail">{c.detail}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span className="label">Anything else the team should know? (optional)</span>
        <textarea name="reason" maxLength={500} rows={3} placeholder="Add context in your own words" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <SubmitButton pending="Sending…">Send report</SubmitButton>
      <p className="muted">Reports are private. The person you report isn’t told who reported them.</p>
    </form>
  );
}
