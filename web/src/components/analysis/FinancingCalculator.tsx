import { useMemo, useState } from 'react';
import type { SavedAnalysis } from '../../../../shared/types/index';

const LOAN_TERM_YEARS = 30;

function monthlyPayment(principal: number, annualRatePercent: number, termYears: number): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

function ForecastChart({ startValue, endValue }: { startValue: number; endValue: number }) {
  // Only two real anchor points (now, +10y forecast) — a straight-line
  // interpolation between them, not fabricated intermediate data.
  const width = 280;
  const height = 100;
  const max = Math.max(startValue, endValue);
  const min = Math.min(startValue, endValue) * 0.95;
  const y = (v: number) => height - ((v - min) / (max - min)) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <line x1="0" y1={y(startValue)} x2={width} y2={y(endValue)} stroke="var(--color-accent-luminous)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="0" cy={y(startValue)} r="4" fill="var(--color-accent-luminous)" />
      <circle cx={width} cy={y(endValue)} r="4" fill="var(--color-accent-luminous)" />
    </svg>
  );
}

export default function FinancingCalculator({ analysis }: { analysis: SavedAnalysis }) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(3.5);

  const price = analysis.current_price ?? analysis.price ?? 0;

  const { rate, breakEvenYear } = useMemo(() => {
    const downPayment = price * (downPaymentPercent / 100);
    const principal = price - downPayment;
    const rate = Math.round(monthlyPayment(principal, interestRate, LOAN_TERM_YEARS));

    let breakEvenYear: number | null = null;
    if (analysis.estimated_rent && analysis.purchase_costs_total != null) {
      const rent = analysis.estimated_rent;
      const costs = analysis.purchase_costs_total;
      if (rent > rate) {
        breakEvenYear = Math.ceil(costs / ((rent - rate) * 12));
      }
    }

    return { rate, breakEvenYear };
  }, [price, downPaymentPercent, interestRate, analysis.estimated_rent, analysis.purchase_costs_total]);

  return (
    <div className="rounded-3xl border border-border-subtle bg-surface p-6">
      <p className="font-mono text-xs tracking-widest text-text-tertiary uppercase">Monatliche Rate</p>
      <p className="mt-1 font-display text-3xl text-accent-luminous">€{rate.toLocaleString('de-DE')}</p>

      <div className="mt-6 space-y-5">
        <div>
          <div className="flex justify-between font-body text-sm text-text-secondary">
            <span>Eigenkapital</span>
            <span className="text-text-primary">{downPaymentPercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent-luminous)]"
          />
        </div>

        <div>
          <div className="flex justify-between font-body text-sm text-text-secondary">
            <span>Zinssatz</span>
            <span className="text-text-primary">{interestRate}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-accent-luminous)]"
          />
        </div>
      </div>

      <p className="mt-4 font-body text-xs text-text-tertiary">
        {breakEvenYear != null
          ? `Ab Jahr ${breakEvenYear} günstiger als mieten`
          : 'Break-even vs. Miete nicht berechenbar (Mietschätzung nicht verfügbar)'}
      </p>

      {analysis.ai_forecast_value_10y != null && price > 0 && (
        <div className="mt-6 border-t border-border-subtle pt-6">
          <p className="font-mono text-xs tracking-widest text-text-tertiary uppercase">10-Jahres-Prognose</p>
          <div className="mt-3">
            <ForecastChart startValue={price} endValue={analysis.ai_forecast_value_10y} />
          </div>
          <div className="mt-2 flex justify-between font-body text-xs text-text-tertiary">
            <span>Heute: €{price.toLocaleString('de-DE')}</span>
            <span>+10J: €{analysis.ai_forecast_value_10y.toLocaleString('de-DE')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
