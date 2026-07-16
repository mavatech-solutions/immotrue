import type { SavedAnalysis } from '../../../../shared/types/index';

function euro(value: number | null): string {
  if (value == null) return '—';
  return `€${value.toLocaleString('de-DE')}`;
}

function yieldRating(grossYield: number | null): string | null {
  if (grossYield == null) return null;
  if (grossYield >= 5) return 'Gut';
  if (grossYield >= 3) return 'Solide';
  return 'Schwach';
}

function locationRating(score: number | null): string | null {
  if (score == null) return null;
  if (score >= 8) return 'Sehr gut';
  if (score >= 6) return 'Gut';
  if (score >= 4) return 'Mittel';
  return 'Schwach';
}

// Days-on-market is a real, meaningful proxy for negotiation room (longer
// listed = generally more negotiable) — not a fabricated number, just a
// simple bucketing of a field we already have.
function negotiationBucket(daysOnMarket: number | null): string | null {
  if (daysOnMarket == null) return null;
  if (daysOnMarket >= 60) return 'HOCH';
  if (daysOnMarket >= 30) return 'MITTEL';
  return 'NIEDRIG';
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="metric-card flex flex-col gap-2 rounded-[20px] border border-border-subtle bg-surface p-6 text-left transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-accent-luminous">
      <span className="text-xl">{icon}</span>
      <span className="font-display text-2xl text-text-primary">{value}</span>
      <span className="font-body text-xs text-text-tertiary">{label}</span>
      {sub && <span className="font-body text-xs font-medium text-accent-luminous">{sub}</span>}
    </div>
  );
}

export default function MetricsGrid({ analysis }: { analysis: SavedAnalysis }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <MetricCard
        icon="📐"
        label="Kaufpreis/m²"
        value={euro(analysis.price_per_sqm)}
        sub={analysis.price_deviation != null ? `${analysis.price_deviation >= 0 ? '+' : ''}${analysis.price_deviation}% vs Ø Markt` : null}
      />

      <MetricCard
        icon="📊"
        label="Mietrendite"
        value={analysis.gross_yield != null ? `${analysis.gross_yield}%` : '—'}
        sub={yieldRating(analysis.gross_yield)}
      />

      <MetricCard
        icon="📍"
        label="Lage-Score"
        value={analysis.location_score != null ? `${analysis.location_score}/10` : '—'}
        sub={locationRating(analysis.location_score)}
      />

      <MetricCard
        icon="🤝"
        label="Verhandlung"
        value={negotiationBucket(analysis.days_on_market) ?? '—'}
        sub={analysis.days_on_market != null ? `${analysis.days_on_market} Tage inseriert` : null}
      />

      <MetricCard
        icon="📄"
        label="Nebenkosten"
        value={euro(analysis.purchase_costs_total)}
        sub={analysis.purchase_costs_breakdown ? `${analysis.purchase_costs_breakdown.totalPercent}% des Kaufpreises` : null}
      />

      <MetricCard
        icon="🏠"
        label="Mietschätzung"
        value={analysis.estimated_rent != null ? `~${euro(analysis.estimated_rent)}` : 'Nicht verfügbar'}
        sub={analysis.estimated_rent != null ? 'pro Monat' : null}
      />
    </div>
  );
}
