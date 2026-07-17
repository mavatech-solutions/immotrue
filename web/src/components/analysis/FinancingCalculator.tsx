import { useMemo, useState } from 'react';
import type { SavedAnalysis } from '../../../../shared/types/index';

const SCENARIOS = [
  { label: 'Konservativ', rate: 4.5 },
  { label: 'Aktuell', rate: 3.5 },
  { label: 'Optimistisch', rate: 2.5 },
];

function monthlyPayment(principal: number, annualRatePercent: number, termYears: number): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

function euro(value: number): string {
  return `€${Math.round(value).toLocaleString('de-DE')}`;
}

// Cumulative cost of buying vs. renting over time — a deterministic
// projection from the calculator's own real inputs (not fabricated
// data), used both for the break-even year and the chart below.
function buildComparison(monthlyRate: number, purchaseCosts: number, monthlyRent: number | null, years: number) {
  const points: { year: number; buy: number; rent: number | null }[] = [];
  for (let year = 0; year <= years; year++) {
    points.push({
      year,
      buy: purchaseCosts + monthlyRate * 12 * year,
      rent: monthlyRent != null ? monthlyRent * 12 * year : null,
    });
  }
  return points;
}

function ComparisonChart({ points }: { points: { year: number; buy: number; rent: number | null }[] }) {
  const width = 280;
  const height = 120;
  const maxY = Math.max(...points.map((p) => Math.max(p.buy, p.rent ?? 0)));
  const x = (year: number) => (year / (points.length - 1)) * width;
  const y = (v: number) => height - (v / maxY) * height;

  const buyPath = points.map((p) => `${x(p.year)},${y(p.buy)}`).join(' ');
  const rentPath = points.filter((p) => p.rent != null).map((p) => `${x(p.year)},${y(p.rent as number)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {rentPath && <polyline points={rentPath} fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" />}
      <polyline points={buyPath} fill="none" stroke="var(--color-accent-luminous)" strokeWidth="2.5" />
    </svg>
  );
}

function FinancingCalculatorInner({ analysis }: { analysis: SavedAnalysis }) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(3.5);
  const [termYears, setTermYears] = useState(30);

  const price = analysis.current_price ?? analysis.price ?? 0;

  const { rate, totalInterest, totalCost, breakEvenYear, comparison } = useMemo(() => {
    const downPayment = price * (downPaymentPercent / 100);
    const principal = price - downPayment;
    const rate = monthlyPayment(principal, interestRate, termYears);
    const totalPaid = rate * termYears * 12;
    const totalInterest = totalPaid - principal;
    const totalCost = downPayment + totalPaid + (analysis.purchase_costs_total ?? 0);

    const comparison = buildComparison(rate, analysis.purchase_costs_total ?? 0, analysis.estimated_rent ?? null, Math.min(termYears, 30));

    let breakEvenYear: number | null = null;
    if (analysis.estimated_rent && analysis.purchase_costs_total != null && analysis.estimated_rent > rate) {
      breakEvenYear = Math.ceil(analysis.purchase_costs_total / ((analysis.estimated_rent - rate) * 12));
    }

    return { rate, totalInterest, totalCost, breakEvenYear, comparison };
  }, [price, downPaymentPercent, interestRate, termYears, analysis.estimated_rent, analysis.purchase_costs_total]);

  return (
    <div className="rounded-3xl border border-border-subtle bg-surface p-6">
      <p className="font-mono text-xs tracking-widest text-text-tertiary uppercase">Monatliche Rate</p>
      <p className="mt-1 font-display text-3xl text-accent-luminous">{euro(rate)}</p>

      <div className="mt-4 flex gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setInterestRate(s.rate)}
            className={`rounded-pill border px-3 py-1.5 font-body text-xs transition-colors duration-200 ${
              interestRate === s.rate
                ? 'border-accent-luminous bg-accent/15 text-accent-luminous'
                : 'border-border-strong text-text-secondary hover:border-accent-luminous'
            }`}
          >
            {s.label} {s.rate}%
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="flex justify-between font-body text-sm text-text-secondary">
            <span>Eigenkapital</span>
            <span className="text-text-primary">{downPaymentPercent}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="mt-2 w-full accent-accent-luminous"
          />
        </div>

        <div>
          <div className="flex justify-between font-body text-sm text-text-secondary">
            <span>Zinssatz</span>
            <span className="text-text-primary">{interestRate}%</span>
          </div>
          <input
            type="range"
            min={2}
            max={6}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="mt-2 w-full accent-accent-luminous"
          />
        </div>

        <div>
          <div className="flex justify-between font-body text-sm text-text-secondary">
            <span>Laufzeit</span>
            <span className="text-text-primary">{termYears} Jahre</span>
          </div>
          <input
            type="range"
            min={10}
            max={35}
            step={1}
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value))}
            className="mt-2 w-full accent-accent-luminous"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
        <div>
          <p className="font-body text-xs text-text-tertiary">Gesamtzinsen</p>
          <p className="font-display text-lg text-text-primary">{euro(totalInterest)}</p>
        </div>
        <div>
          <p className="font-body text-xs text-text-tertiary">Gesamtkosten</p>
          <p className="font-display text-lg text-text-primary">{euro(totalCost)}</p>
        </div>
      </div>

      <p className="mt-4 font-body text-xs text-text-tertiary">
        {breakEvenYear != null
          ? `Ab Jahr ${breakEvenYear} günstiger als mieten`
          : 'Break-even vs. Miete nicht berechenbar (Mietschätzung nicht verfügbar)'}
      </p>

      <div className="mt-6 border-t border-border-subtle pt-6">
        <div className="flex items-center gap-4 font-body text-xs text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-luminous" /> Kaufen (kumuliert)
          </span>
          {analysis.estimated_rent != null && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-text-tertiary" /> Mieten (kumuliert)
            </span>
          )}
        </div>
        <div className="mt-3">
          <ComparisonChart points={comparison} />
        </div>
      </div>
    </div>
  );
}

export default function FinancingCalculator({ analysis, isPremium }: { analysis: SavedAnalysis; isPremium: boolean }) {
  if (!isPremium) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface p-6">
        <div aria-hidden className="select-none space-y-4 blur-sm">
          <div>
            <p className="font-mono text-xs tracking-widest text-text-tertiary uppercase">Monatliche Rate</p>
            <p className="mt-1 font-display text-3xl text-accent-luminous">€2.847</p>
          </div>
          <div className="h-2 w-full rounded bg-border-subtle" />
          <div className="h-2 w-full rounded bg-border-subtle" />
          <div className="h-2 w-2/3 rounded bg-border-subtle" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/70 p-6 text-center">
          <p className="font-body text-sm text-text-secondary">Finanzierungsrechner mit Kaufen-vs-Mieten-Vergleich</p>
          <a
            href="/upgrade"
            className="inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-5 py-2.5 font-body text-sm font-medium text-on-accent"
          >
            Premium freischalten
          </a>
        </div>
      </div>
    );
  }

  return <FinancingCalculatorInner analysis={analysis} />;
}
