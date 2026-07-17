import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function ResetPasswordForm() {
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // supabase-js parses the recovery token out of the URL on load and
    // fires PASSWORD_RECOVERY once that session is ready — until then the
    // form stays disabled so updateUser() isn't called without a session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <p className="font-display text-lg text-text-primary">Passwort geändert</p>
        <a
          href="/login"
          className="mt-2 inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent"
        >
          Jetzt anmelden
        </a>
      </div>
    );
  }

  if (!ready) {
    return <p className="font-body text-sm text-text-secondary">Link wird geprüft…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 font-body text-sm text-text-secondary">
        Neues Passwort
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
        />
      </label>

      <label className="flex flex-col gap-2 font-body text-sm text-text-secondary">
        Neues Passwort bestätigen
        <input
          type="password"
          required
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="rounded-xl border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
        />
      </label>

      {error && <p className="font-body text-sm text-verdict-overpriced">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Speichert…' : 'Passwort speichern'}
      </button>
    </form>
  );
}
