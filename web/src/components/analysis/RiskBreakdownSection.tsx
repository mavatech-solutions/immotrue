import type { SavedAnalysis } from '../../../../shared/types/index';

const CATEGORIES: { key: keyof NonNullable<SavedAnalysis['risk_breakdown']>; icon: string; label: string }[] = [
  { key: 'baujahrRisiko', icon: '📅', label: 'Baujahr-Risiko' },
  { key: 'energieeffizienz', icon: '⚡', label: 'Energieeffizienz' },
  { key: 'sanierungsbedarf', icon: '🔧', label: 'Sanierungsbedarf' },
  { key: 'lageRisiko', icon: '📍', label: 'Lage-Risiko' },
  { key: 'rechtliches', icon: '⚖️', label: 'Rechtliches' },
];

function riskColor(value: number): string {
  if (value <= 33) return 'var(--color-verdict-cheap)';
  if (value <= 66) return 'var(--color-verdict-expensive)';
  return 'var(--color-verdict-overpriced)';
}

// Older saved analyses stored risk_breakdown as plain numbers per category
// (before the AI's schema grew a "reason" alongside each value) — this
// normalizes either shape so both still render instead of breaking.
function normalize(entry: number | { value: number; reason: string }): { value: number; reason: string | null } {
  if (typeof entry === 'number') return { value: entry, reason: null };
  return entry;
}

export default function RiskBreakdownSection({ analysis }: { analysis: SavedAnalysis }) {
  const breakdown = analysis.risk_breakdown;
  if (!breakdown) return null;

  const scores = CATEGORIES.map(({ key, icon, label }) => ({ key, icon, label, ...normalize(breakdown[key] as never) }));
  const overallScore = Math.round(scores.reduce((sum, { value }) => sum + value, 0) / scores.length);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-text-primary">Risiko-Analyse</h2>
        <span
          className="inline-flex items-center gap-1 rounded-pill px-3 py-1 font-display text-sm"
          style={{ backgroundColor: `color-mix(in srgb, ${riskColor(overallScore)} 15%, transparent)`, color: riskColor(overallScore) }}
        >
          {overallScore}/100
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scores.map(({ key, icon, label, value, reason }) => (
          <div key={key} className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-body text-sm text-text-primary">
                <span>{icon}</span>
                {label}
              </div>
              <span className="font-display text-sm" style={{ color: riskColor(value) }}>
                {value}/100
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-pill bg-border-subtle">
              <div className="h-full rounded-pill" style={{ width: `${value}%`, backgroundColor: riskColor(value) }} />
            </div>

            {reason && <p className="font-body text-xs text-text-secondary">{reason}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
