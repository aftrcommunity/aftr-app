'use client';

import { useActionState, useState } from 'react';
import { createThread, type PostState } from '../app/(club)/forum/actions';
import { CHANNELS } from '../lib/forum';
import PhotoPicker from './PhotoPicker';
import SubmitButton from './SubmitButton';

export default function NewThreadForm({ defaultChannel, userId }: { defaultChannel: string; userId: string }) {
  const [state, action] = useActionState<PostState, FormData>(createThread, {});
  const [poll, setPoll] = useState(false);
  const [count, setCount] = useState(2);
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

      <PhotoPicker userId={userId} folder="posts" max={4} label="Photos (optional)" />
      <p className="muted" style={{ marginTop: -6 }}>Only share photos of people who’ve said yes to being posted.</p>

      <label className="check">
        <input type="checkbox" name="add_poll" checked={poll} onChange={(e) => setPoll(e.target.checked)} />
        <span><strong>Add a poll</strong> — members pick one option. Votes are private; everyone sees the totals.</span>
      </label>
      {poll && (
        <div className="poll-edit">
          {Array.from({ length: count }, (_, i) => (
            <label key={i} className="field">
              <span className="label">Option {i + 1}</span>
              <input name={`poll_${i}`} maxLength={80} required={i < 2} placeholder={i === 0 ? 'e.g. Friday' : i === 1 ? 'e.g. Saturday' : ''} />
            </label>
          ))}
          {count < 6 && (
            <button type="button" className="link-btn" onClick={() => setCount(count + 1)} style={{ alignSelf: 'flex-start' }}>
              + Add an option
            </button>
          )}
        </div>
      )}

      {state.error && <p className="form-error">{state.error}</p>}
      <SubmitButton pending="Posting…">Post</SubmitButton>
    </form>
  );
}
