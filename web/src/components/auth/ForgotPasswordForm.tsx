import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <p className="font-display text-lg text-text-primary">E-Mail unterwegs</p>
        <p className="font-body text-sm text-text-secondary">
          Falls ein Konto mit <strong className="text-text-primary">{email}</strong> existiert, haben wir dir einen Link zum
          Zurücksetzen deines Passworts geschickt.
        </p>
      </div>
    );
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

      {error && <p className="font-body text-sm text-verdict-overpriced">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Sendet…' : 'Link zum Zurücksetzen senden'}
      </button>

      <a href="/login" className="text-center font-body text-sm text-accent-luminous transition-colors duration-200 hover:text-text-primary">
        Zurück zur Anmeldung
      </a>
    </form>
  );
}
