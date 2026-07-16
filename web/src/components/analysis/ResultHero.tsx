import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { getPortalById } from '../../../../shared/utils/portalDetector';
import type { SavedAnalysis } from '../../../../shared/types/index';

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

function CountUpPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return <>{display.toLocaleString('de-DE')}</>;
}

export default function ResultHero({ analysis, isPremium }: { analysis: SavedAnalysis; isPremium: boolean }) {
  const portal = analysis.portal ? getPortalById(analysis.portal) : undefined;

  const metaParts = [
    analysis.size_sqm ? `${analysis.size_sqm}m²` : null,
    analysis.rooms ? `${analysis.rooms} Zimmer` : null,
    analysis.year_built ? `Baujahr ${analysis.year_built}` : null,
  ].filter(Boolean);

  const verdict = analysis.price_verdict ?? 'fair';
  const price = analysis.current_price ?? analysis.price ?? 0;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* LINKS — Objekt-Info (60%) */}
      <div className="lg:col-span-3 rounded-3xl border border-border-subtle bg-surface p-8 text-left">
        <h1 className="font-display text-2xl md:text-[2rem] text-text-primary">
          {analysis.address ?? analysis.district ?? analysis.city ?? 'Adresse nicht verfügbar'}
        </h1>

        {metaParts.length > 0 && <p className="mt-2 font-body text-text-secondary">{metaParts.join(' · ')}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          {portal && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-border-subtle px-3 py-1 font-body text-xs font-medium text-text-secondary">
              {portal.flag} {portal.name}
            </span>
          )}
          {analysis.days_on_market != null && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-border-subtle px-3 py-1 font-body text-xs font-medium text-text-secondary">
              Seit {analysis.days_on_market} Tagen inseriert
            </span>
          )}
        </div>
      </div>

      {/* RECHTS — Preis-Ampel (40%) */}
      <div className="lg:col-span-2 flex flex-col items-center rounded-3xl border border-border-subtle bg-surface-elevated p-8 text-center">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="inline-flex items-center justify-center rounded-pill px-6 py-3 font-display text-lg tracking-wide"
          style={{ backgroundColor: `color-mix(in srgb, ${VERDICT_COLOR[verdict]} 15%, transparent)`, color: VERDICT_COLOR[verdict] }}
        >
          {VERDICT_LABEL[verdict]}
        </motion.span>

        <p className="mt-6 font-display text-5xl md:text-6xl text-text-primary">
          €<CountUpPrice value={price} />
        </p>

        {analysis.price_deviation != null && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 font-body text-sm font-medium"
            style={{ color: VERDICT_COLOR[verdict] }}
          >
            {Math.abs(analysis.price_deviation)}% {analysis.price_deviation >= 0 ? 'über' : 'unter'} Marktwert
          </motion.p>
        )}

        {analysis.suggested_offer_price != null && (
          isPremium ? (
            <p className="mt-6 font-body text-sm text-text-secondary">
              Empfohlenes Angebot: <span className="font-medium text-text-primary">€{analysis.suggested_offer_price.toLocaleString('de-DE')}</span>
            </p>
          ) : (
            <div className="relative mt-6 w-full">
              <p className="select-none font-body text-sm text-text-secondary blur-sm">
                Empfohlenes Angebot: €000.000
              </p>
              <span className="absolute inset-0 flex items-center justify-center rounded-pill bg-accent/15 px-3 py-1 font-mono text-xs font-medium text-accent-luminous">
                Premium
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
