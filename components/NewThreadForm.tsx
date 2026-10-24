'use client';

import { useActionState } from 'react';
import { createThread, type PostState } from '../app/(club)/forum/actions';
import { CHANNELS } from '../lib/forum';

export default function NewThreadForm({ defaultChannel }: { defaultChannel: string }) {
  const [state, action, pending] = useActionState<PostState, FormData>(createThread, {});
  return (
    <form className="form" action={action}>
      <label className="field">
        <span className="label">Channel</span>
        <select name="channel" defaultValue={defaultChannel}>
          {CHANNELS.map((c) => (
            <option key={c.id} value={c.id}>
              # {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="label">Title</span>
        <input name="title" required minLength={3} maxLength={120} placeholder="e.g. Who's going to Happily Ever AFTR.?" />
      </label>
      <label className="field">
        <span className="label">Your post</span>
        <textarea name="body" required maxLength={4000} rows={6} placeholder="Say hello, ask a question, share a recommendation…" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="wbtn wbtn-fill" disabled={pending}>
        {pending ? 'Posting…' : 'Post'}
      </button>
    </form>
  );
}
