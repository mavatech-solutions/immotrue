import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Alert } from '../../../shared/types/index';

export interface AlertedListing {
  id: string;
  alert_id: string;
  listing_url: string;
  alerted_at: string;
}

export type NewAlert = Omit<Alert, 'id' | 'user_id' | 'created_at' | 'active'>;

async function fetchAlerts(): Promise<Alert[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login?redirect=/alerts';
    throw new Error('not authenticated');
  }

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Alarme konnten nicht geladen werden.');
  return data as Alert[];
}

async function fetchRecentMatches(alertIds: string[]): Promise<AlertedListing[]> {
  if (alertIds.length === 0) return [];
  const { data, error } = await supabase
    .from('alerted_listings')
    .select('*')
    .in('alert_id', alertIds)
    .order('alerted_at', { ascending: false })
    .limit(10);
  if (error) throw new Error('Treffer konnten nicht geladen werden.');
  return data as AlertedListing[];
}

async function fetchMatchCounts(alertIds: string[]): Promise<Record<string, number>> {
  if (alertIds.length === 0) return {};
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const { data, error } = await supabase
    .from('alerted_listings')
    .select('alert_id')
    .in('alert_id', alertIds)
    .gte('alerted_at', startOfMonth);
  if (error) throw new Error('Trefferanzahl konnte nicht geladen werden.');

  const counts: Record<string, number> = {};
  for (const row of data as { alert_id: string }[]) counts[row.alert_id] = (counts[row.alert_id] ?? 0) + 1;
  return counts;
}

export function useAlerts() {
  const queryClient = useQueryClient();
  const alertsQuery = useQuery({ queryKey: ['alerts'], queryFn: fetchAlerts });
  const alerts = useMemo(() => alertsQuery.data ?? [], [alertsQuery.data]);
  const alertIds = useMemo(() => alerts.map((a) => a.id), [alerts]);

  const matchesQuery = useQuery({
    queryKey: ['alert-matches', alertIds],
    queryFn: () => fetchRecentMatches(alertIds),
    enabled: alertIds.length > 0,
  });

  const countsQuery = useQuery({
    queryKey: ['alert-match-counts', alertIds],
    queryFn: () => fetchMatchCounts(alertIds),
    enabled: alertIds.length > 0,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['alerts'] });

  const createMutation = useMutation({
    mutationFn: async (data: NewAlert) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('not authenticated');
      const { error } = await supabase.from('alerts').insert({ ...data, user_id: session.user.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Alert> }) => {
      const { error } = await supabase.from('alerts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    alerts,
    isLoading: alertsQuery.isLoading,
    isError: alertsQuery.isError,
    error: alertsQuery.error as Error | null,
    recentMatches: matchesQuery.data ?? [],
    matchCounts: countsQuery.data ?? {},
    create: (data: NewAlert) => createMutation.mutateAsync(data),
    update: (id: string, data: Partial<Alert>) => updateMutation.mutateAsync({ id, data }),
    remove: (id: string) => deleteMutation.mutateAsync(id),
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
