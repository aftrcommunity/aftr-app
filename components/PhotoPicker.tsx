'use client';

import { useRef, useState } from 'react';
import { supabaseBrowser } from '../lib/supabase/client';

const BUCKET = 'member-media';

type Item = { path: string; preview: string };

// Shrinks a photo on the phone before upload (fast on slow data), and saves a small copy too
async function resize(file: File, max: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that photo'))), 'image/jpeg', quality),
  );
}

// Upload photos into the member's own folder. The chosen paths go into a hidden
// field (name) as JSON, and are saved when the form is submitted.
export default function PhotoPicker({
  userId,
  folder,
  name = 'photos',
  max = 4,
  initial = [],
  label = 'Photos',
}: {
  userId: string;
  folder: 'posts' | 'profile';
  name?: string;
  max?: number;
  initial?: Item[];
  label?: string;
}) {
  const [items, setItems] = useState<Item[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = max - items.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(`You can add up to ${max} photos.`);
    setBusy(true);
    const supabase = supabaseBrowser();
    try {
      for (const file of picked) {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const path = `${userId}/${folder}/${id}.jpg`;
        const [full, small] = await Promise.all([resize(file, 1600, 0.8), resize(file, 520, 0.72)]);
        const a = await supabase.storage.from(BUCKET).upload(path, full, { contentType: 'image/jpeg' });
        if (a.error) throw a.error;
        const b = await supabase.storage.from(BUCKET).upload(path.replace(/\.jpg$/, '.sm.jpg'), small, { contentType: 'image/jpeg' });
        if (b.error) throw b.error;
        setItems((list) => [...list, { path, preview: URL.createObjectURL(small) }]);
      }
    } catch (e) {
      setError(`That photo didn’t upload. Please try again. (${e instanceof Error ? e.message : 'unknown error'})`);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const remove = (path: string) => setItems((list) => list.filter((i) => i.path !== path));
  const makeFirst = (path: string) =>
    setItems((list) => [...list.filter((i) => i.path === path), ...list.filter((i) => i.path !== path)]);

  return (
    <div className="field">
      <span className="label">
        {label} <span className="label-quiet">({items.length} of {max})</span>
      </span>
      <input type="hidden" name={name} value={JSON.stringify(items.map((i) => i.path))} />
      {items.length > 0 && (
        <div className="picker-grid">
          {items.map((i, n) => (
            <div key={i.path} className="picker-item" style={{ backgroundImage: `url(${i.preview})` }}>
              {folder === 'profile' && n === 0 && <span className="picker-main">Main</span>}
              <div className="picker-tools">
                {folder === 'profile' && n > 0 && (
                  <button type="button" onClick={() => makeFirst(i.path)} aria-label="Make this your main photo">★</button>
                )}
                <button type="button" onClick={() => remove(i.path)} aria-label="Remove this photo">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length < max && (
        <label className={`picker-add${busy ? ' is-busy' : ''}`}>
          <input
            ref={input}
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={(e) => add(e.target.files)}
          />
          {busy ? 'Uploading…' : items.length ? '+ Add another photo' : '+ Add photos'}
        </label>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
