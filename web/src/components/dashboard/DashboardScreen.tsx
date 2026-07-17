import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const queryClient = new QueryClient();

async function fetchDashboardData() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '/login?redirect=/dashboard';
    throw new Error('not authenticated');
  }

  const [{ data: profile }, { count: analysesCount }] = await Promise.all([
    supabase.from('profiles').select('email, is_premium, premium_until').eq('id', session.user.id).single(),
    supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id),
  ]);

  return { profile, analysesCount: analysesCount ?? 0 };
}

function DashboardScreenInner() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboardData });

  if (isLoading) return <p className="py-24 text-center font-body text-text-secondary">Lädt…</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-text-primary">
          Willkommen{data.profile?.email ? `, ${data.profile.email}` : ''}
        </h1>
        <p className="mt-2 font-body text-text-secondary">
          {data.profile?.is_premium ? (
            <span className="text-accent-luminous">⭐ Premium aktiv</span>
          ) : (
            <>
              Du nutzt ImmoTrue Free.{' '}
              <a href="/upgrade" className="text-accent-luminous transition-colors duration-200 hover:text-text-primary">
                Jetzt upgraden
              </a>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <a
          href="/analyse"
          className="flex flex-col gap-2 rounded-3xl border border-border-subtle bg-surface-elevated p-6 transition-colors duration-200 hover:border-accent-luminous"
        >
          <span className="text-2xl">🔍</span>
          <p className="font-display text-lg text-text-primary">Neue Analyse</p>
          <p className="font-body text-sm text-text-secondary">Ein Inserat analysieren lassen.</p>
        </a>
        <a
          href="/portfolio"
          className="flex flex-col gap-2 rounded-3xl border border-border-subtle bg-surface-elevated p-6 transition-colors duration-200 hover:border-accent-luminous"
        >
          <span className="text-2xl">📁</span>
          <p className="font-display text-lg text-text-primary">Mein Portfolio</p>
          <p className="font-body text-sm text-text-secondary">{data.analysesCount} gespeicherte Analysen.</p>
        </a>
        <a
          href="/alerts"
          className="flex flex-col gap-2 rounded-3xl border border-border-subtle bg-surface-elevated p-6 transition-colors duration-200 hover:border-accent-luminous"
        >
          <span className="text-2xl">🔔</span>
          <p className="font-display text-lg text-text-primary">Meine Alarme</p>
          <p className="font-body text-sm text-text-secondary">Wunschalarme verwalten.</p>
        </a>
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardScreenInner />
    </QueryClientProvider>
  );
}
