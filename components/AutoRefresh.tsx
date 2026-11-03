'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Re-checks the page every few seconds while it's open (for new messages)
export default function AutoRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
