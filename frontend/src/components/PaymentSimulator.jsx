import { useState } from 'react';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentSimulator({ onSuccess, onFailure, onCancel }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | failed

  function simulate() {
    setStatus('loading');
    setTimeout(() => {
      const ok = Math.random() < 0.9;
      setStatus(ok ? 'success' : 'failed');
      setTimeout(() => {
        if (ok) onSuccess();
        else onFailure();
      }, 800);
    }, 1500);
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <Loader size={36} className="text-accent animate-spin-slow" />
        <p className="text-sm text-ink-soft font-medium">Processing payment…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <CheckCircle size={44} className="text-accent" />
        <p className="text-base font-semibold text-ink">Payment approved!</p>
        <p className="text-xs text-ink-soft">Placing your order…</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <XCircle size={44} className="text-red-400" />
        <p className="text-base font-semibold text-ink">Payment declined</p>
        <p className="text-xs text-ink-soft mb-2">Please try again or choose a different method.</p>
        <button
          onClick={() => setStatus('idle')}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-accent text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <button
        onClick={simulate}
        className="w-full rounded-xl py-3 text-sm font-semibold bg-accent text-white"
      >
        Confirm &amp; Pay
      </button>
      <button
        onClick={onCancel}
        className="w-full rounded-xl py-3 text-sm font-medium border border-line text-ink-soft"
      >
        Go back
      </button>
    </div>
  );
}
