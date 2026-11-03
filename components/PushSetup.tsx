'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../lib/supabase/client';
import { VAPID_PUBLIC_KEY } from '../lib/push';

type State = 'loading' | 'unsupported' | 'install-first' | 'blocked' | 'off' | 'on';

const toBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

// "Notifications on this phone": turn lock-screen notifications on or off
export default function PushSetup() {
  const [state, setState] = useState<State>('loading');
  const [previews, setPreviews] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState(ios && !standalone ? 'install-first' : 'unsupported');
        return;
      }
      if (ios && !standalone) return setState('install-first');
      if (Notification.permission === 'denied') return setState('blocked');
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return setState('off');
      const { data } = await supabaseBrowser().from('push_subscriptions').select('previews').eq('endpoint', sub.endpoint).maybeSingle();
      if (!data) return setState('off');
      setPreviews(!!data.previews);
      setState('on');
    })().catch(() => setState('unsupported'));
  }, []);

  async function turnOn(withPreviews = previews) {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(VAPID_PUBLIC_KEY) }));
      const json = sub.toJSON();
      const { error: e } = await supabaseBrowser().rpc('save_push_subscription', {
        endpoint_url: sub.endpoint,
        key_p256dh: json.keys?.p256dh,
        key_auth: json.keys?.auth,
        show_previews: withPreviews,
      });
      if (e) throw e;
      setPreviews(withPreviews);
      setState('on');
    } catch (e) {
      setError(`That didn’t work. Please try again. (${e instanceof Error ? e.message : 'unknown error'})`);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabaseBrowser().from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setState('off');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'loading') return null;
  return (
    <section className="push-box">
      <div className="label" style={{ color: 'var(--lime)' }}>Notifications on this phone</div>
      {state === 'install-first' && (
        <p>
          To get notifications on your iPhone, first add AFTR. to your home screen: open this page in <strong>Safari</strong>,
          tap the Share button, then <strong>Add to Home Screen</strong>. Open AFTR. from the new icon and come back here.
        </p>
      )}
      {state === 'unsupported' && <p>This browser can’t show notifications. Try Chrome on Android, or Safari on iPhone after adding AFTR. to your home screen.</p>}
      {state === 'blocked' && <p>Notifications are blocked for AFTR. on this phone. Turn them on in your phone’s settings for this app or browser, then come back here.</p>}
      {state === 'off' && (
        <>
          <p>Get replies, reactions, messages and report updates on your lock screen.</p>
          <button className="wbtn wbtn-fill" onClick={() => turnOn()} disabled={busy}>
            {busy ? 'Turning on…' : 'Turn on notifications'}
          </button>
        </>
      )}
      {state === 'on' && (
        <>
          <p>On. By default your lock screen just says “AFTR.” with no names or messages, so nothing private shows if someone sees your phone.</p>
          <label className="check">
            <input type="checkbox" checked={previews} disabled={busy} onChange={(e) => turnOn(e.target.checked)} />
            <span><strong>Show names and message previews</strong> on my lock screen</span>
          </label>
          <button className="link-btn" onClick={turnOff} disabled={busy} style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
            Turn off on this phone
          </button>
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
