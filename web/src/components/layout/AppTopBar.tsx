import { useEffect, useMemo, useState } from 'react';
import { detectPortal, isValidUrl } from '../../../../shared/utils/portalDetector';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

function initialsFromEmail(email: string | undefined): string {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  const chars = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [name[0], name[1] ?? ''];
  return chars.join('').toUpperCase();
}

export default function AppTopBar() {
  const { logout } = useAuth();
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user.email);
    });
  }, []);

  const portal = useMemo(() => {
    if (!url || !isValidUrl(url)) return null;
    return detectPortal(url);
  }, [url]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!portal) return;
    window.location.href = `/analyse?url=${encodeURIComponent(url)}`;
  }

  return (
    <div className="flex flex-1 items-center gap-4 px-4 py-3 md:px-6">
      <form onSubmit={handleSubmit} className="relative hidden flex-1 max-w-xl sm:block">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Neue URL analysieren…"
          className="w-full rounded-xl border border-border-strong bg-surface px-4 py-2.5 font-body text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-luminous"
        />
        {portal && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-pill bg-accent/15 px-2.5 py-1 font-body text-xs font-medium text-accent-luminous">
            {portal.flag} {portal.name}
          </span>
        )}
      </form>

      <div className="ml-auto flex items-center gap-4">
        <a
          href="/alerts"
          title="Wunschalarm"
          className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-lg transition-colors duration-200 hover:bg-surface-elevated"
        >
          🔔
        </a>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous font-body text-xs font-semibold text-on-accent"
          >
            {initialsFromEmail(email)}
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl border border-border-subtle bg-surface-elevated p-2 shadow-lg"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {email && <p className="truncate px-2 py-1.5 font-body text-xs text-text-tertiary">{email}</p>}
              <button
                type="button"
                onClick={() => logout()}
                className="w-full rounded-lg px-2 py-1.5 text-left font-body text-sm text-text-secondary transition-colors duration-200 hover:bg-surface hover:text-text-primary"
              >
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
