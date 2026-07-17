import { useState } from 'react';
import { useAuth, type UserType } from '../../hooks/useAuth';

const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'buyer', label: 'Käufer:in' },
  { value: 'investor', label: 'Investor:in' },
  { value: 'both', label: 'Beides' },
];

export default function RegisterForm() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [userType, setUserType] = useState<UserType>('buyer');
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      const { hasSession } = await register(email, password, userType);
      if (hasSession) {
        window.location.href = '/dashboard';
      } else {
        setConfirmationSent(true);
        setLoading(false);
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <p className="font-display text-lg text-text-primary">Fast geschafft!</p>
        <p className="font-body text-sm text-text-secondary">
          Wir haben dir eine Bestätigungs-E-Mail an <strong className="text-text-primary">{email}</strong> geschickt. Bitte klicke auf den
          Link darin, um dein Konto zu aktivieren.
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

      <label className="flex flex-col gap-2 font-body text-sm text-text-secondary">
        Passwort
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
        Passwort bestätigen
        <input
          type="password"
          required
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="rounded-xl border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
        />
      </label>

      <div>
        <p className="font-body text-sm text-text-secondary">Ich bin</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {USER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setUserType(t.value)}
              className={`rounded-pill border px-4 py-2 font-body text-sm transition-colors duration-200 ${
                userType === t.value ? 'border-accent-luminous text-accent-luminous' : 'border-border-strong text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2 font-body text-sm text-text-secondary">
        <input
          type="checkbox"
          required
          checked={agbAccepted}
          onChange={(e) => setAgbAccepted(e.target.checked)}
          className="mt-0.5 accent-accent-luminous"
        />
        Ich akzeptiere die{' '}
        <a href="/agb" target="_blank" className="text-accent-luminous transition-colors duration-200 hover:text-text-primary">
          AGB
        </a>{' '}
        und{' '}
        <a href="/datenschutz" target="_blank" className="text-accent-luminous transition-colors duration-200 hover:text-text-primary">
          Datenschutzerklärung
        </a>
        .
      </label>

      {error && <p className="font-body text-sm text-verdict-overpriced">{error}</p>}

      <button
        type="submit"
        disabled={loading || !agbAccepted}
        className="mt-2 inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Registriert…' : 'Registrieren'}
      </button>

      <p className="text-center font-body text-sm text-text-secondary">
        Schon einen Account?{' '}
        <a href="/login" className="text-accent-luminous transition-colors duration-200 hover:text-text-primary">
          Anmelden
        </a>
      </p>
    </form>
  );
}
