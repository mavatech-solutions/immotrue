import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { AnalysisStatus, SavedAnalysis } from '../../../shared/types/index';

class RefreshError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function fetchPortfolio(): Promise<SavedAnalysis[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '/login?redirect=/portfolio';
    throw new Error('not authenticated');
  }

  // RLS on `analyses` already scopes this to auth.uid() = user_id, so a
  // direct client-side select is safe — no backend proxy needed.
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('last_updated_at', { ascending: false });

  if (error) throw new Error('Portfolio konnte nicht geladen werden.');
  return data as SavedAnalysis[];
}

// Unlike list/update/delete, refreshing re-runs the full paid pipeline
// (Apify + Claude via full-analysis), so it goes through the same backend
// endpoint and rate limit as a brand new analysis — not a direct Supabase call.
async function refreshAnalysis(analysis: SavedAnalysis): Promise<SavedAnalysis> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new RefreshError('Nicht eingeloggt.', 'not_authenticated');

  const res = await fetch(`${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/full-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url: analysis.original_url, user_id: session.user.id, analysis_id: analysis.id }),
  });

  const json = await res.json();
  if (!res.ok) throw new RefreshError(json.message ?? 'Aktualisierung fehlgeschlagen.', json.error ?? 'unknown');
  return json as SavedAnalysis;
}

export function usePortfolio() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['portfolio'], queryFn: fetchPortfolio });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SavedAnalysis> }) => {
      const { error } = await supabase.from('analyses').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('analyses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  const refreshMutation = useMutation({
    mutationFn: refreshAnalysis,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  const analyses = query.data ?? [];

  return {
    analyses,
    getByStatus: (status: AnalysisStatus) => analyses.filter((a) => a.status === status),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    update: (id: string, data: Partial<SavedAnalysis>) => updateMutation.mutateAsync({ id, data }),
    remove: (id: string) => deleteMutation.mutateAsync(id),
    refresh: (analysis: SavedAnalysis) => refreshMutation.mutateAsync(analysis),
    refreshingId: refreshMutation.isPending ? refreshMutation.variables?.id : null,
    refreshError: refreshMutation.isError ? (refreshMutation.error as RefreshError) : null,
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,
  };
}
