import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { getPortalById } from '../../../../shared/utils/portalDetector';
import type { SavedAnalysis } from '../../../../shared/types/index';
import { generateAnalysisPdf } from '../../lib/generatePdf';
import { supabase } from '../../lib/supabase';

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

function LocationRing({ score }: { score: number | null }) {
  const value = score ?? 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 10);

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--color-border-subtle)" strokeWidth="6" />
        {score != null && (
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--color-verdict-cheap)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        )}
      </svg>
      <span className="absolute font-display text-xl text-text-primary">{score ?? '—'}</span>
    </div>
  );
}

export default function ResultHero({ analysis, isPremium }: { analysis: SavedAnalysis; isPremium: boolean }) {
  const [status, setStatus] = useState(analysis.status);
  const isFavorite = status === 'favorite';

  async function toggleFavorite() {
    if (!isPremium) {
      window.location.href = '/#preise';
      return;
    }
    const next = isFavorite ? 'interesting' : 'favorite';
    setStatus(next);
    await supabase.from('analyses').update({ status: next }).eq('id', analysis.id);
  }

  const portal = analysis.portal ? getPortalById(analysis.portal) : undefined;

  const metaParts = [
    analysis.size_sqm ? `${analysis.size_sqm}m²` : null,
    analysis.rooms ? `${analysis.rooms} Zimmer` : null,
    analysis.year_built ? `Baujahr ${analysis.year_built}` : null,
    analysis.district,
    portal?.name,
    analysis.days_on_market != null ? `seit ${analysis.days_on_market} Tagen` : null,
  ].filter(Boolean);

  const verdict = analysis.price_verdict ?? 'fair';
  const price = analysis.current_price ?? analysis.price ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Address + meta + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-text-primary">
            {analysis.address ?? analysis.district ?? analysis.city ?? 'Adresse nicht verfügbar'}
          </h1>
          {metaParts.length > 0 && <p className="mt-1 font-body text-sm text-text-secondary">{metaParts.join(' · ')}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            title={isPremium ? undefined : 'Portfolio ist ein Premium-Feature'}
            onClick={toggleFavorite}
            className={`inline-flex items-center justify-center gap-1.5 rounded-pill border px-5 py-2.5 font-body text-sm transition-colors duration-200 ${
              isFavorite
                ? 'border-verdict-expensive bg-verdict-expensive/15 text-verdict-expensive'
                : 'border-border-strong text-text-primary hover:border-accent-luminous'
            }`}
          >
            {isFavorite ? '⭐ Favorit' : '☆ Als Favorit speichern'}
          </button>

          <a
            href={analysis.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-pill border border-border-strong px-5 py-2.5 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous"
          >
            🔗 Original-Inserat öffnen
          </a>

          <a
            href="/analyse"
            className="inline-flex items-center justify-center rounded-pill border border-border-strong px-5 py-2.5 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous"
          >
            Neue Analyse
          </a>
          <button
            type="button"
            title={isPremium ? undefined : 'PDF-Export ist ein Premium-Feature'}
            onClick={() => isPremium && generateAnalysisPdf(analysis)}
            disabled={!isPremium}
            className="inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-5 py-2.5 font-body text-sm text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Als PDF exportieren
          </button>
        </div>
      </div>

      {/* Preis-Ampel + Lage-Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-border-subtle bg-surface-elevated p-8 lg:col-span-2">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center rounded-pill px-5 py-2.5 font-display text-base tracking-wide"
            style={{ backgroundColor: `color-mix(in srgb, ${VERDICT_COLOR[verdict]} 15%, transparent)`, color: VERDICT_COLOR[verdict] }}
          >
            {VERDICT_LABEL[verdict]}
          </motion.span>

          <p className="font-display text-4xl md:text-5xl text-text-primary">
            €<CountUpPrice value={price} />
          </p>

          {analysis.suggested_offer_price != null && (
            isPremium ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent/15 px-4 py-2 font-body text-sm font-medium text-accent-luminous">
                Empfohlen: €{analysis.suggested_offer_price.toLocaleString('de-DE')}
              </span>
            ) : (
              <div className="relative">
                <span className="select-none rounded-pill bg-accent/15 px-4 py-2 font-body text-sm font-medium text-accent-luminous blur-sm">
                  Empfohlen: €000.000
                </span>
                <span className="absolute inset-0 flex items-center justify-center rounded-pill bg-surface-elevated/80 font-mono text-xs font-medium text-accent-luminous">
                  Premium
                </span>
              </div>
            )
          )}

          {analysis.price_deviation != null && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-body text-sm font-medium"
              style={{ color: VERDICT_COLOR[verdict] }}
            >
              ▲ {Math.abs(analysis.price_deviation)}% {analysis.price_deviation >= 0 ? 'über' : 'unter'} Marktwert
            </motion.p>
          )}
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-border-subtle bg-surface-elevated p-8">
          <LocationRing score={analysis.location_score} />
          <div>
            <p className="font-display text-lg text-text-primary">Lage-Score</p>
            <p className="font-body text-sm text-verdict-cheap">
              {analysis.location_score != null && analysis.location_score >= 8 ? 'Sehr gut' : analysis.location_score != null ? 'Gut' : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
