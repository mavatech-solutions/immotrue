import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePortfolio } from '../../hooks/usePortfolio';
import { getPortalById } from '../../../../shared/utils/portalDetector';
import type { AnalysisStatus, SavedAnalysis } from '../../../../shared/types/index';

const queryClient = new QueryClient();

const VERDICT_LABEL: Record<string, string> = {
  cheap: 'GÜNSTIG',
  fair: 'FAIR',
  expensive: 'TEUER',
  overpriced: 'ÜBERTEUERT',
};

const VERDICT_COLOR: Record<string, string> = {
  cheap: 'var(--color-verdict-cheap)',
  fair: 'var(--color-verdict-fair)',
  expensive: 'var(--color-verdict-expensive)',
  overpriced: 'var(--color-verdict-overpriced)',
};

const CATEGORIES: { value: AnalysisStatus; icon: string; label: string }[] = [
  { value: 'favorite', icon: '⭐', label: 'Favorit' },
  { value: 'interesting', icon: '👀', label: 'Interessant' },
  { value: 'viewed', icon: '✅', label: 'Besichtigt' },
  { value: 'rejected', icon: '❌', label: 'Verworfen' },
];

type SortKey = 'newest' | 'price' | 'change';

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'heute';
  if (days === 1) return 'vor 1 Tag';
  return `vor ${days} Tagen`;
}

function priceChange(analysis: SavedAnalysis): number | null {
  if (!analysis.original_price || !analysis.current_price || analysis.original_price === analysis.current_price) return null;
  return Math.round(((analysis.current_price - analysis.original_price) / analysis.original_price) * 1000) / 10;
}

function matchesSearch(analysis: SavedAnalysis, query: string): boolean {
  if (!query) return true;
  const haystack = [analysis.address, analysis.district, analysis.city].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function sortAnalyses(list: SavedAnalysis[], key: SortKey): SavedAnalysis[] {
  const copy = [...list];
  if (key === 'price') return copy.sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0));
  if (key === 'change') return copy.sort((a, b) => Math.abs(priceChange(b) ?? 0) - Math.abs(priceChange(a) ?? 0));
  return copy.sort((a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime());
}

function PortfolioCard({
  analysis,
  onRefresh,
  onDelete,
  isRefreshing,
  isDeleting,
}: {
  analysis: SavedAnalysis;
  onRefresh: () => void;
  onDelete: () => void;
  isRefreshing: boolean;
  isDeleting: boolean;
}) {
  const category = CATEGORIES.find((c) => c.value === analysis.status);
  const portal = analysis.portal ? getPortalById(analysis.portal) : undefined;
  const verdict = analysis.price_verdict ?? 'fair';
  const change = priceChange(analysis);

  const metaParts = [
    analysis.size_sqm ? `${analysis.size_sqm}m²` : null,
    analysis.rooms ? `${analysis.rooms} Zimmer` : null,
    portal?.name,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border-subtle bg-surface-elevated p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex items-center justify-center rounded-pill px-3 py-1 font-display text-xs tracking-wide"
          style={{ backgroundColor: `color-mix(in srgb, ${VERDICT_COLOR[verdict]} 15%, transparent)`, color: VERDICT_COLOR[verdict] }}
        >
          {VERDICT_LABEL[verdict]}
        </span>
        {category && (
          <span className="inline-flex items-center gap-1 font-body text-xs text-text-secondary">
            {category.icon} {category.label}
          </span>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg text-text-primary">
          {analysis.address ?? analysis.district ?? analysis.city ?? 'Adresse nicht verfügbar'}
        </h3>
        {metaParts.length > 0 && <p className="mt-1 font-body text-sm text-text-secondary">{metaParts.join(' · ')}</p>}
      </div>

      <div className="flex items-baseline gap-3">
        <p className="font-display text-2xl text-text-primary">€{(analysis.current_price ?? analysis.price ?? 0).toLocaleString('de-DE')}</p>
        {change != null && (
          <span className="font-body text-sm font-medium" style={{ color: change < 0 ? 'var(--color-verdict-cheap)' : 'var(--color-verdict-overpriced)' }}>
            {change < 0 ? '▼' : '▲'} {Math.abs(change)}% seit Erstanalyse
          </span>
        )}
      </div>

      <p className="font-body text-xs text-text-tertiary">{daysAgo(analysis.analyzed_at)} analysiert</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={`/ergebnis?id=${analysis.id}`}
          className="inline-flex items-center justify-center rounded-pill border border-border-strong px-4 py-2 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous"
        >
          Ansehen
        </a>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center rounded-pill border border-border-strong px-4 py-2 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous disabled:opacity-50"
        >
          {isRefreshing ? 'Aktualisiert…' : 'Aktualisieren'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-pill border border-border-strong px-4 py-2 font-body text-sm text-verdict-overpriced transition-colors duration-200 hover:border-verdict-overpriced disabled:opacity-50"
        >
          {isDeleting ? 'Löscht…' : 'Löschen'}
        </button>
      </div>
    </div>
  );
}

function PortfolioScreenInner() {
  const { analyses, isLoading, isError, error, remove, refresh, refreshingId, refreshError, deletingId } = usePortfolio();
  const [category, setCategory] = useState<'all' | AnalysisStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [search, setSearch] = useState('');

  const searched = useMemo(() => analyses.filter((a) => matchesSearch(a, search)), [analyses, search]);

  const counts = useMemo(() => {
    const c: Record<'all' | AnalysisStatus, number> = { all: searched.length, favorite: 0, interesting: 0, viewed: 0, rejected: 0 };
    for (const a of searched) c[a.status]++;
    return c;
  }, [searched]);

  const filtered = useMemo(
    () => (category === 'all' ? searched : searched.filter((a) => a.status === category)),
    [searched, category],
  );
  const sorted = useMemo(() => sortAnalyses(filtered, sortKey), [filtered, sortKey]);

  async function handleDelete(analysis: SavedAnalysis) {
    if (!window.confirm(`"${analysis.address ?? analysis.district ?? analysis.city}" wirklich löschen?`)) return;
    await remove(analysis.id);
  }

  if (isLoading) return <p className="py-24 text-center font-body text-text-secondary">Lädt…</p>;
  if (isError) return <p className="py-24 text-center font-body text-verdict-overpriced">{error?.message ?? 'Unerwarteter Fehler.'}</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl md:text-3xl text-text-primary">
          Meine Analysen <span className="text-text-tertiary">({analyses.length})</span>
        </h1>
        <a
          href="/analyse"
          className="inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-5 py-2.5 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90"
        >
          Neue Analyse
        </a>
      </div>

      {analyses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border-subtle bg-surface-elevated py-24 text-center">
          <p className="font-body text-text-secondary">Noch keine Analysen gespeichert.</p>
          <a href="/analyse" className="font-body text-sm text-accent-luminous transition-colors duration-200 hover:text-text-primary">
            Erste Analyse starten
          </a>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-4 py-2 font-body text-sm transition-colors duration-200 ${
                category === 'all' ? 'border-accent-luminous text-accent-luminous' : 'border-border-strong text-text-secondary hover:border-accent-luminous'
              }`}
            >
              Alle ({counts.all})
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`inline-flex items-center gap-1.5 rounded-pill border px-4 py-2 font-body text-sm transition-colors duration-200 ${
                  category === c.value ? 'border-accent-luminous text-accent-luminous' : 'border-border-strong text-text-secondary hover:border-accent-luminous'
                }`}
              >
                {c.icon} {c.label} ({counts[c.value]})
              </button>
            ))}

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Adresse suchen…"
                className="rounded-pill border border-border-strong bg-surface px-4 py-2 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
              />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-pill border border-border-strong bg-surface px-4 py-2 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
              >
                <option value="newest">Neueste</option>
                <option value="price">Preis</option>
                <option value="change">Preisänderung</option>
              </select>
            </div>
          </div>

          {refreshError && <p className="font-body text-sm text-verdict-overpriced">{refreshError.message}</p>}

          {sorted.length === 0 ? (
            <p className="py-16 text-center font-body text-text-secondary">Keine Analysen in dieser Kategorie.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((analysis) => (
                <PortfolioCard
                  key={analysis.id}
                  analysis={analysis}
                  onRefresh={() => refresh(analysis)}
                  onDelete={() => handleDelete(analysis)}
                  isRefreshing={refreshingId === analysis.id}
                  isDeleting={deletingId === analysis.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PortfolioScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <PortfolioScreenInner />
    </QueryClientProvider>
  );
}
