import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { SavedAnalysis } from '../../../../shared/types/index';
import ResultHero from './ResultHero';
import MetricsGrid from './MetricsGrid';

const queryClient = new QueryClient();

async function fetchResult(id: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = `/login?redirect=${encodeURIComponent(`/ergebnis?id=${id}`)}`;
    throw new Error('not authenticated');
  }

  // RLS on `analyses` already scopes this to auth.uid() = user_id, so a
  // direct client-side select is safe — no backend proxy needed.
  const [{ data: analysis, error: analysisError }, { data: profile }] = await Promise.all([
    supabase.from('analyses').select('*').eq('id', id).single(),
    supabase.from('profiles').select('is_premium').eq('id', session.user.id).single(),
  ]);

  if (analysisError || !analysis) throw new Error('Analyse nicht gefunden.');
  return { analysis: analysis as SavedAnalysis, isPremium: profile?.is_premium ?? false };
}

function ResultScreenInner() {
  const [id] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null,
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => fetchResult(id as string),
    enabled: !!id,
    retry: false,
  });

  if (!id) {
    return <p className="py-24 text-center font-body text-verdict-overpriced">Keine Analyse-ID angegeben.</p>;
  }

  if (isLoading) {
    return <p className="py-24 text-center font-body text-text-secondary">Lädt…</p>;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-body text-verdict-overpriced">{(error as Error)?.message ?? 'Unerwarteter Fehler.'}</p>
        <a href="/analyse" className="font-body text-sm text-accent-luminous hover:text-text-primary transition-colors duration-200">
          Neue Analyse starten
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ResultHero analysis={data.analysis} isPremium={data.isPremium} />
      <MetricsGrid analysis={data.analysis} />
    </div>
  );
}

export default function ResultScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <ResultScreenInner />
    </QueryClientProvider>
  );
}
