import { useState } from 'react';
import type { SavedAnalysis } from '../../../../shared/types/index';

function firstSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences.slice(0, count).join(' ').trim();
}

function LocationDetails({ analysis }: { analysis: SavedAnalysis }) {
  const loc = analysis.location_details;
  if (!loc) return <p className="font-body text-sm text-text-secondary">Keine Lage-Daten verfügbar.</p>;

  const rows = [
    ['ÖPNV', loc.poisTransit],
    ['Einkaufen', loc.poisShopping],
    ['Schulen', loc.poisSchools],
    ['Ärzte', loc.poisHealth],
    ['Parks', loc.poisParks],
  ].filter(([, count]) => count != null) as [string, number][];

  if (rows.length === 0) return <p className="font-body text-sm text-text-secondary">Keine Lage-Daten verfügbar.</p>;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {rows.map(([label, count]) => (
        <li key={label} className="font-body text-sm text-text-secondary">
          <span className="text-text-primary">{count}</span> {label} in der Nähe
        </li>
      ))}
    </ul>
  );
}

function NegotiationTipCard({ analysis }: { analysis: SavedAnalysis }) {
  const [copied, setCopied] = useState(false);
  if (!analysis.ai_negotiation_tip) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(analysis.ai_negotiation_tip as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border-2 border-accent-luminous bg-accent/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="font-body text-sm text-text-primary">
          <span className="font-medium text-accent-luminous">💡 Verhandlungstipp:</span> {analysis.ai_negotiation_tip}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-pill border border-accent-luminous px-3 py-1.5 font-body text-xs font-medium text-accent-luminous transition-colors duration-200 hover:bg-accent/10"
        >
          {copied ? 'Kopiert ✓' : 'Kopieren'}
        </button>
      </div>
    </div>
  );
}

export default function AiReportSection({ analysis, isPremium }: { analysis: SavedAnalysis; isPremium: boolean }) {
  if (!isPremium) {
    return (
      <div className="rounded-3xl border border-border-subtle bg-surface p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-text-primary">🤖 KI-Analyse</h2>

        {analysis.ai_summary && (
          <p className="mt-4 font-body text-sm text-text-secondary">{firstSentences(analysis.ai_summary, 3)}</p>
        )}

        <div className="relative mt-4 overflow-hidden rounded-2xl">
          <div aria-hidden className="select-none space-y-3 blur-sm">
            <div className="h-4 w-full rounded bg-border-subtle" />
            <div className="h-4 w-5/6 rounded bg-border-subtle" />
            <div className="h-4 w-full rounded bg-border-subtle" />
            <div className="h-4 w-2/3 rounded bg-border-subtle" />
            <div className="h-4 w-full rounded bg-border-subtle" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/60 p-6 text-center">
            <p className="font-body text-sm text-text-secondary">Lage, Risiken, Verhandlungsempfehlung & 10-Jahres-Prognose</p>
            <a
              href="/#preise"
              className="inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-5 py-2.5 font-body text-sm font-medium text-on-accent"
            >
              Premium für Vollbericht
            </a>
          </div>
        </div>
      </div>
    );
  }

  const items = [
    {
      key: 'preisbewertung',
      icon: '📊',
      title: 'Preisbewertung',
      content: analysis.ai_summary ? (
        <p className="font-body text-sm text-text-secondary">{analysis.ai_summary}</p>
      ) : null,
    },
    {
      key: 'lage',
      icon: '📍',
      title: 'Lage',
      content: <LocationDetails analysis={analysis} />,
    },
    {
      key: 'risiken',
      icon: '⚠️',
      title: 'Risiken',
      content: analysis.ai_risks?.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {analysis.ai_risks.map((risk) => (
            <li key={risk} className="font-body text-sm text-text-secondary">
              {risk}
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body text-sm text-text-secondary">Keine besonderen Risiken erkannt.</p>
      ),
    },
    {
      key: 'empfehlung',
      icon: '💡',
      title: 'Verhandlungsempfehlung',
      content: analysis.ai_recommendation ? (
        <p className="font-body text-sm text-text-secondary">{analysis.ai_recommendation}</p>
      ) : null,
    },
    {
      key: 'prognose',
      icon: '🔮',
      title: '10-Jahres Prognose',
      content: analysis.ai_forecast_10y ? (
        <div className="space-y-2">
          <p className="font-body text-sm text-text-secondary">{analysis.ai_forecast_10y}</p>
          {analysis.ai_forecast_value_10y != null && (
            <p className="font-body text-sm font-medium text-text-primary">
              Geschätzter Wert in 10 Jahren: €{analysis.ai_forecast_value_10y.toLocaleString('de-DE')}
            </p>
          )}
        </div>
      ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <NegotiationTipCard analysis={analysis} />

      <div className="rounded-3xl border border-border-subtle bg-surface p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-text-primary">🤖 KI-Analyse</h2>

        <div className="mt-4 divide-y divide-border-subtle">
          {items.map((item) => (
            <details key={item.key} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body text-text-primary marker:content-none">
                <span className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.title}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-text-tertiary transition-transform duration-200 group-open:rotate-90"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </summary>
              <div className="mt-3 pl-7">{item.content ?? <p className="font-body text-sm text-text-tertiary">Nicht verfügbar.</p>}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
