'use client';

import { useFormStatus } from 'react-dom';

// A submit button that can't be pressed twice while the first press is still sending
export default function SubmitButton({
  children,
  pending: pendingLabel = 'Sending…',
  className = 'wbtn wbtn-fill',
  name,
  value,
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
