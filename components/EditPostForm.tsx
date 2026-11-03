'use client';

import { useActionState } from 'react';
import { updatePost, type PostState } from '../app/(club)/forum/actions';
import SubmitButton from './SubmitButton';

export default function EditPostForm({
  threadId,
  replyId,
  title,
  body,
}: {
  threadId: number;
  replyId?: number;
  title?: string;
  body: string;
}) {
  const [state, action] = useActionState<PostState, FormData>(updatePost, {});
  return (
    <form className="form" action={action}>
      <input type="hidden" name="thread_id" value={threadId} />
      {replyId && <input type="hidden" name="reply_id" value={replyId} />}
      {!replyId && (
        <label className="field">
          <span className="label">Title</span>
          <input name="title" required minLength={3} maxLength={120} defaultValue={title} />
        </label>
      )}
      <label className="field">
        <span className="label">{replyId ? 'Your reply' : 'Your post'}</span>
        <textarea name="body" required maxLength={4000} rows={7} defaultValue={body} />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <SubmitButton pending="Saving…">Save changes</SubmitButton>
      <p className="muted">Your post will show “edited”.</p>
    </form>
  );
}
