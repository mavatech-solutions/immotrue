import type { SavedAnalysis } from '../../../../shared/types/index';

function euro(value: number | null): string {
  if (value == null) return '—';
  return `€${value.toLocaleString('de-DE')}`;
}

function yieldRating(grossYield: number | null): string | null {
  if (grossYield == null) return null;
  if (grossYield >= 5) return 'Gut';
  if (grossYield >= 3) return 'Solide';
  return 'Niedrig';
}

function RingProgress({ score }: { score: number | null }) {
  const value = score ?? 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-border-subtle)" strokeWidth="6" />
        {score != null && (
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="var(--color-accent-luminous)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        )}
      </svg>
      <span className="absolute font-body text-sm font-medium text-text-primary">{score ?? '—'}</span>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  children,
}: {
  icon: string;
  label: string;
  value?: string;
  sub?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="metric-card flex flex-col gap-3 rounded-[20px] border border-border-subtle bg-surface p-6 text-left transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-accent-luminous">
      <span className="text-2xl">{icon}</span>
      <span className="font-body text-sm text-text-tertiary">{label}</span>
      {children ?? <span className="font-display text-2xl text-text-primary">{value}</span>}
      {sub && <span className="font-body text-xs text-text-secondary">{sub}</span>}
    </div>
  );
}

export default function MetricsGrid({ analysis }: { analysis: SavedAnalysis }) {
  const negotiationPotential =
    analysis.suggested_offer_price != null && analysis.current_price
      ? Math.round(((analysis.current_price - analysis.suggested_offer_price) / analysis.current_price) * 1000) / 10
      : null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        icon="💰"
        label="Kaufpreis/m²"
        value={analysis.price_per_sqm != null ? `${euro(analysis.price_per_sqm)}` : '—'}
        sub={analysis.price_deviation != null ? `${Math.abs(analysis.price_deviation)}% ${analysis.price_deviation >= 0 ? 'über' : 'unter'} Marktdurchschnitt` : null}
      />

      <MetricCard
        icon="📈"
        label="Mietrendite"
        value={analysis.gross_yield != null ? `${analysis.gross_yield}%` : '—'}
        sub={yieldRating(analysis.gross_yield)}
      />

      <MetricCard icon="📍" label="Lage-Score">
        <RingProgress score={analysis.location_score} />
      </MetricCard>

      <MetricCard
        icon="🤝"
        label="Verhandlungspotenzial"
        value={negotiationPotential != null ? `${negotiationPotential}%` : '—'}
        sub={negotiationPotential != null ? `${euro(analysis.suggested_offer_price)} vorgeschlagen` : null}
      />

      <MetricCard icon="📋" label="Kaufnebenkosten" value={euro(analysis.purchase_costs_total)} />

      <MetricCard icon="🏠" label="Mietschätzung" value={analysis.estimated_rent != null ? `${euro(analysis.estimated_rent)}/Monat` : 'Nicht verfügbar'} />
    </div>
  );
}
