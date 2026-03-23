import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { pingBackend } from '../utils/apiClient';

const POLL_INTERVAL_MS = 15000;
const RETRY_INTERVAL_MS = 5000;

/**
 * Shows a banner when the backend is unreachable and auto-retries.
 * Renders nothing when connected so it doesn't distract during presentations.
 */
export default function ConnectionStatus() {
  const [connected, setConnected] = useState(true);
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const ok = await pingBackend();
      setConnected(ok);
      if (ok) setDismissed(false);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, [checking]);

  useEffect(() => {
    const t = setTimeout(() => check().catch(() => setConnected(false)), 100);
    const interval = setInterval(() => check().catch(() => setConnected(false)), POLL_INTERVAL_MS);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  // When disconnected, retry more often
  useEffect(() => {
    if (connected || dismissed) return;
    const t = setInterval(check, RETRY_INTERVAL_MS);
    return () => clearInterval(t);
  }, [connected, dismissed, check]);

  if (connected || dismissed) return null;

  return (
    <div
      role="alert"
      className="w-full bg-amber-500 text-amber-950 px-4 py-2 shadow-md flex items-center justify-center gap-3 flex-wrap"
    >
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium text-sm">
        Backend disconnected. Retrying automatically…
      </span>
      <button
        type="button"
        onClick={() => {
          setChecking(true);
          pingBackend()
            .then((ok) => {
              setConnected(ok);
              if (ok) setDismissed(false);
            })
            .finally(() => setChecking(false));
        }}
        disabled={checking}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white rounded text-sm font-medium hover:bg-amber-800 disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
        Retry now
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-amber-900 hover:underline text-sm"
      >
        Dismiss
      </button>
    </div>
  );
}

export function useConnectionStatus() {
  const [connected, setConnected] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const ok = await pingBackend();
      if (!cancelled) setConnected(ok);
    };
    run();
    const t = setInterval(run, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);
  return connected;
}
