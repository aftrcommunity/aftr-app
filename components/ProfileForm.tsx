'use client';

import { useActionState } from 'react';
import { saveProfile, type FormState } from '../app/(club)/members/actions';
import PhotoPicker from './PhotoPicker';
import SubmitButton from './SubmitButton';

export default function ProfileForm({
  userId,
  nickname,
  bio,
  instagram,
  listed,
  allowMessages,
  photos,
}: {
  userId: string;
  nickname: string;
  bio: string;
  instagram: string;
  listed: boolean;
  allowMessages: boolean;
  photos: { path: string; preview: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveProfile, {});
  return (
    <form className="form" action={action}>
      <PhotoPicker userId={userId} folder="profile" max={6} initial={photos} label="Your photos" />
      <p className="muted" style={{ marginTop: -6 }}>The first photo is your main one. Tap ★ to make another your main photo.</p>
      <label className="field">
        <span className="label">Nickname</span>
        <input name="display_name" required maxLength={40} defaultValue={nickname} />
        <span className="hint">What members see on your posts and messages, and how the app greets you. Your card shows your full name.</span>
      </label>
      <label className="field">
        <span className="label">About you (optional)</span>
        <textarea name="bio" maxLength={300} rows={4} defaultValue={bio} placeholder="A few words: what you’re into, what you’re looking for at AFTR." />
      </label>
      <label className="field">
        <span className="label">Instagram (optional)</span>
        <input name="instagram" maxLength={60} defaultValue={instagram} placeholder="yourhandle" autoCapitalize="none" />
      </label>
      <label className="check">
        <input type="checkbox" name="listed" defaultChecked={listed} />
        <span><strong>Show me in the members list.</strong> If you turn this off, members can still open your profile from your posts.</span>
      </label>
      <label className="check">
        <input type="checkbox" name="allow_messages" defaultChecked={allowMessages} />
        <span><strong>Let members message me.</strong> Conversations you already have stay open.</span>
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.saved && <p className="notice">Saved.</p>}
      <SubmitButton pending="Saving…">Save profile</SubmitButton>
    </form>
  );
}
