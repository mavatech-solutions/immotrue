import type { SavedAnalysis } from '../../../../shared/types/index';

export default function ProsConsSection({ analysis }: { analysis: SavedAnalysis }) {
  if (!analysis.ai_pros?.length && !analysis.ai_cons?.length) return null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <p className="font-mono text-xs font-medium tracking-widest text-verdict-cheap uppercase">Vorteile</p>
        <ul className="mt-3 space-y-2">
          {analysis.ai_pros?.map((pro) => (
            <li key={pro} className="flex items-start gap-2 font-body text-sm text-text-secondary">
              <span className="mt-0.5 text-verdict-cheap">✓</span>
              {pro}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-mono text-xs font-medium tracking-widest text-verdict-overpriced uppercase">Nachteile</p>
        <ul className="mt-3 space-y-2">
          {analysis.ai_cons?.map((con) => (
            <li key={con} className="flex items-start gap-2 font-body text-sm text-text-secondary">
              <span className="mt-0.5 text-verdict-overpriced">✗</span>
              {con}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
