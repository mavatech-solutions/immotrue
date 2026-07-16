import { useMemo, useState } from 'react';
import { detectPortal, isValidUrl } from '../../../../shared/utils/portalDetector';
import { supabase } from '../../lib/supabase';

export default function UrlAnalyzer() {
  const [url, setUrl] = useState('');

  const portal = useMemo(() => {
    if (!url || !isValidUrl(url)) return null;
    return detectPortal(url);
  }, [url]);

  async function handleAnalyze(e: React.MouseEvent) {
    e.preventDefault();
    if (!portal) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/analyse?url=${url}`)}`;
      return;
    }

    window.location.href = `/analyse?url=${encodeURIComponent(url)}`;
  }

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

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="#"
          onClick={handleAnalyze}
          aria-disabled={!portal}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-4 font-body font-medium text-text-primary transition-opacity duration-200 hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Kostenlos analysieren
        </a>
        <a
          href="#demo"
          className="inline-flex items-center justify-center gap-2 rounded-pill border border-accent-luminous px-6 py-4 font-body font-medium text-accent-luminous transition-colors duration-200 hover:bg-accent/10"
        >
          Demo ansehen
        </a>
      </div>
    </div>
  );
}
