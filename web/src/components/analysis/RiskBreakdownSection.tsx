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

export default function RiskBreakdownSection({ analysis }: { analysis: SavedAnalysis }) {
  const breakdown = analysis.risk_breakdown;
  if (!breakdown) return null;

  const overallScore = Math.round(
    CATEGORIES.reduce((sum, { key }) => sum + breakdown[key], 0) / CATEGORIES.length,
  );

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

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map(({ key, icon, label }) => {
          const value = breakdown[key];
          return (
            <div key={key} className="rounded-2xl border border-border-subtle bg-surface p-4">
              <div className="flex items-center gap-2 font-body text-sm text-text-primary">
                <span>{icon}</span>
                {label}
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-border-subtle">
                <div
                  className="h-full rounded-pill"
                  style={{ width: `${value}%`, backgroundColor: riskColor(value) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
