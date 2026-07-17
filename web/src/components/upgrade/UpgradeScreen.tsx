import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const queryClient = new QueryClient();

async function fetchProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { session: null, isPremium: false };

  const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', session.user.id).single();
  return { session, isPremium: profile?.is_premium ?? false };
}

async function callFunction(name: string, body: unknown): Promise<{ url: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Nicht eingeloggt.');

  const res = await fetch(`${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Unerwarteter Fehler.');
  return json;
}

function UpgradeScreenInner() {
  const { data, isLoading } = useQuery({ queryKey: ['upgrade-profile'], queryFn: fetchProfile });
  const [pendingPlan, setPendingPlan] = useState<'monthly' | 'yearly' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: 'monthly' | 'yearly') {
    setError(null);
    setPendingPlan(plan);
    try {
      const { url } = await callFunction('create-checkout-session', { plan });
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
      setPendingPlan(null);
    }
  }

  async function openPortal() {
    setError(null);
    setPendingPlan('portal');
    try {
      const { url } = await callFunction('create-portal-session', {});
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
      setPendingPlan(null);
    }
  }

  if (isLoading) return <p className="py-24 text-center font-body text-text-secondary">Lädt…</p>;

  if (!data?.session) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-body text-text-secondary">Bitte melde dich zuerst an, um Premium zu aktivieren.</p>
        <a
          href="/login?redirect=/upgrade"
          className="inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90"
        >
          Anmelden
        </a>
      </div>
    );
  }

  if (data.isPremium) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-display text-xl text-text-primary">⭐ Du bist bereits Premium</p>
        {error && <p className="font-body text-sm text-verdict-overpriced">{error}</p>}
        <button
          type="button"
          onClick={openPortal}
          disabled={pendingPlan === 'portal'}
          className="inline-flex items-center justify-center rounded-pill border border-border-strong px-6 py-3 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous disabled:opacity-50"
        >
          {pendingPlan === 'portal' ? 'Öffnet…' : 'Abo verwalten'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-16 text-center">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-text-primary">Premium freischalten</h1>
        <p className="mt-2 font-body text-text-secondary">Unbegrenzte Analysen, KI-Vollbericht, Portfolio, Preisalarm und mehr.</p>
      </div>

      {error && <p className="font-body text-sm text-verdict-overpriced">{error}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-3xl border border-border-subtle bg-surface-elevated p-8 text-left">
          <p className="font-display text-3xl text-text-primary">
            €6,99<span className="font-body text-base text-text-tertiary"> / Monat</span>
          </p>
          <button
            type="button"
            onClick={() => startCheckout('monthly')}
            disabled={pendingPlan !== null}
            className="mt-auto inline-flex items-center justify-center rounded-pill border border-border-strong px-6 py-3 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous disabled:opacity-50"
          >
            {pendingPlan === 'monthly' ? 'Weiterleitung…' : 'Monatlich starten'}
          </button>
        </div>

        <div className="relative flex flex-col gap-4 rounded-3xl border-2 border-accent-luminous bg-surface-elevated p-8 text-left">
          <span className="absolute -top-3 left-8 rounded-pill bg-linear-to-r from-accent to-accent-luminous px-4 py-1 font-mono text-xs tracking-widest text-on-accent uppercase">
            2 Monate gratis
          </span>
          <p className="font-display text-3xl text-text-primary">
            €49,99<span className="font-body text-base text-text-tertiary"> / Jahr</span>
          </p>
          <button
            type="button"
            onClick={() => startCheckout('yearly')}
            disabled={pendingPlan !== null}
            className="mt-auto inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {pendingPlan === 'yearly' ? 'Weiterleitung…' : 'Jährlich starten'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <UpgradeScreenInner />
    </QueryClientProvider>
  );
}
