import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || '/dashboard';
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 font-body text-sm text-text-secondary">
        E-Mail
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
        />
      </label>

      <label className="flex flex-col gap-2 font-body text-sm text-text-secondary">
        Passwort
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
        />
      </label>

      <a href="/forgot-password" className="self-end font-body text-sm text-accent-luminous transition-colors duration-200 hover:text-text-primary">
        Passwort vergessen?
      </a>

      {error && <p className="font-body text-sm text-verdict-overpriced">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Anmelden…' : 'Anmelden'}
      </button>

      <p className="text-center font-body text-sm text-text-secondary">
        Noch keinen Account?{' '}
        <a href="/register" className="text-accent-luminous transition-colors duration-200 hover:text-text-primary">
          Registrieren
        </a>
      </p>
    </form>
  );
}
