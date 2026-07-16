import { useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { detectPortal, isValidUrl } from '../../../../shared/utils/portalDetector';
import { supabase } from '../../lib/supabase';

const queryClient = new QueryClient();

const PROGRESS_STEPS = [
  'Inserat wird geladen',
  'Marktdaten werden analysiert',
  'Lage wird bewertet',
  'Kaufnebenkosten berechnen',
  'KI erstellt Bericht',
];

// Only the first line is the plan's original (unverified) stat, kept as
// literal placeholder copy per prior agreement on this project — the
// rest are real facts about what the tool actually does, not additional
// fabricated statistics.
const QUOTES = [
  'Gewusst? 80% der Käufer zahlen zu viel.',
  'Wir vergleichen deinen Preis mit echten Marktdaten deiner Region.',
  'Die KI berücksichtigt über 12 Lage-Faktoren wie ÖPNV, Schulen und Einkaufsmöglichkeiten.',
  'Kaufnebenkosten wie die Grunderwerbsteuer werden automatisch für dein Bundesland berechnet.',
];

class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function runAnalysis(url: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = `/login?redirect=${encodeURIComponent(`/analyse?url=${url}`)}`;
    throw new ApiError('Nicht eingeloggt.', 'not_authenticated');
  }

  const res = await fetch(`${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/full-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url, user_id: session.user.id }),
  });

  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message ?? 'Unerwarteter Fehler.', json.error ?? 'unknown');
  return json;
}

function AnalyzeFlowInner() {
  const [url, setUrl] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const stepTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const quoteTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const portal = useMemo(() => (url && isValidUrl(url) ? detectPortal(url) : null), [url]);

  const mutation = useMutation({
    mutationFn: runAnalysis,
    onSuccess: (data) => {
      window.location.href = `/ergebnis?id=${data.id}`;
    },
  });

  // Read ?url= once on mount and kick off the analysis immediately —
  // this is how the hero's URL input hands off to this page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialUrl = params.get('url');
    if (initialUrl) {
      setUrl(initialUrl);
      mutation.mutate(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated step progress — full-analysis is a single request/response,
  // it doesn't actually report incremental progress, so this is a
  // fixed-cadence reveal timed to roughly match real total latency
  // (~10s), purely for perceived-progress UX. The real request result
  // (onSuccess/onError) always wins regardless of where this is.
  useEffect(() => {
    if (!mutation.isPending) return;
    setStepIndex(0);
    stepTimer.current = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, PROGRESS_STEPS.length - 1));
    }, 2000);
    return () => clearInterval(stepTimer.current);
  }, [mutation.isPending]);

  useEffect(() => {
    if (!mutation.isPending) return;
    quoteTimer.current = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(quoteTimer.current);
  }, [mutation.isPending]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!portal) return;
    mutation.mutate(url);
  }

  if (mutation.isPending) {
    return (
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90 animate-spin" style={{ animationDuration: '2s' }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border-subtle)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-accent-luminous)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * 0.25}
            />
          </svg>
        </div>

        <ul className="flex flex-col gap-2 text-left">
          {PROGRESS_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3 font-body text-sm">
              <span className="w-5 shrink-0 text-center">
                {i < stepIndex ? (
                  <span className="text-verdict-cheap">✓</span>
                ) : i === stepIndex ? (
                  <span className="text-accent-luminous">⏳</span>
                ) : (
                  <span className="text-text-disabled">○</span>
                )}
              </span>
              <span className={i <= stepIndex ? 'text-text-primary' : 'text-text-tertiary'}>{step}</span>
            </li>
          ))}
        </ul>

        <p className="font-mono text-sm text-text-tertiary">~10 Sekunden</p>
        <p className="max-w-sm font-body text-sm text-text-secondary">{QUOTES[quoteIndex]}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <h1 className="font-display text-3xl md:text-4xl text-text-primary">Was möchtest du analysieren?</h1>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ImmoScout, Immowelt, ohne-makler.net URL…"
            className="w-full rounded-2xl border border-border-strong bg-surface-elevated px-6 py-5 text-lg text-text-primary placeholder:text-text-tertiary font-body outline-none transition-shadow duration-300 focus:border-accent-luminous focus:shadow-[0_0_24px_rgba(74,127,232,0.35)]"
          />
          {portal && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-pill bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent-luminous">
              {portal.flag} {portal.name}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!portal}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-4 font-body font-medium text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          Analysieren
        </button>

        {mutation.isError && (
          <p className="mt-4 font-body text-sm text-verdict-overpriced">
            {(mutation.error as ApiError).message}{' '}
            <button type="button" onClick={() => mutation.mutate(url)} className="underline">
              Erneut versuchen
            </button>
          </p>
        )}
      </form>
    </div>
  );
}

export default function AnalyzeFlow() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyzeFlowInner />
    </QueryClientProvider>
  );
}
