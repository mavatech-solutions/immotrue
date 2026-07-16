import type { SavedAnalysis } from '../../../../shared/types/index';

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

export default function AiReportSection({ analysis }: { analysis: SavedAnalysis }) {
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
      title: 'Empfehlung',
      content: analysis.ai_recommendation || analysis.ai_negotiation_tip ? (
        <div className="space-y-2">
          {analysis.ai_recommendation && <p className="font-body text-sm text-text-secondary">{analysis.ai_recommendation}</p>}
          {analysis.ai_negotiation_tip && (
            <p className="rounded-xl bg-accent/10 p-3 font-body text-sm text-accent-luminous">
              Verhandlungstipp: {analysis.ai_negotiation_tip}
            </p>
          )}
        </div>
      ) : null,
    },
    {
      key: 'prognose',
      icon: '🔮',
      title: 'Prognose',
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
  );
}
