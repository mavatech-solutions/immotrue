import { useMemo, useState } from 'react';
import { detectPortal, isValidUrl } from '../../../../shared/utils/portalDetector';

export default function UrlAnalyzer() {
  const [url, setUrl] = useState('');

  const portal = useMemo(() => {
    if (!url || !isValidUrl(url)) return null;
    return detectPortal(url);
  }, [url]);

  return (
    <div className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ImmoScout, Immowelt, ohne-makler.net URL…"
          className="w-full rounded-2xl border border-border-strong bg-surface-elevated px-6 py-5 text-lg text-text-primary placeholder:text-text-tertiary font-body outline-none transition-shadow duration-300 focus:border-accent-luminous focus:shadow-[0_0_24px_rgba(74,127,232,0.35)]"
        />
        {portal && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-pill bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent-luminous animate-[fade-in_0.2s_ease-out]">
            {portal.flag} {portal.name}
          </span>
        )}
      </div>

      <a
        href={portal ? `/analyse?url=${encodeURIComponent(url)}` : '#'}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-accent to-accent-luminous px-6 py-4 font-body font-medium text-text-primary transition-opacity duration-200 hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        aria-disabled={!portal}
      >
        Kostenlos analysieren
      </a>
    </div>
  );
}
