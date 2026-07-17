import { useState } from 'react';
import type { AnalysisStatus, SavedAnalysis } from '../../../../shared/types/index';
import { supabase } from '../../lib/supabase';

const CATEGORIES: { value: AnalysisStatus; icon: string; label: string }[] = [
  { value: 'favorite', icon: '⭐', label: 'Favorit' },
  { value: 'interesting', icon: '👀', label: 'Interessant' },
  { value: 'viewed', icon: '✅', label: 'Besichtigt' },
  { value: 'rejected', icon: '❌', label: 'Verworfen' },
];

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-pill border border-verdict-cheap bg-surface-elevated px-5 py-3 font-body text-sm text-text-primary shadow-lg">
      {message}
    </div>
  );
}

export default function SavePortfolioSection({ analysis, isPremium }: { analysis: SavedAnalysis; isPremium: boolean }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AnalysisStatus>(analysis.status);
  const [note, setNote] = useState(analysis.user_notes ?? '');
  const [alertEnabled, setAlertEnabled] = useState(analysis.price_alert_enabled);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from('analyses')
      .update({ status: category, user_notes: note || null, price_alert_enabled: alertEnabled })
      .eq('id', analysis.id);
    setSaving(false);
    setOpen(false);
    setToast('In Portfolio gespeichert ⭐');
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="rounded-3xl border border-border-subtle bg-surface p-6 text-center">
      <p className="font-display text-lg text-text-primary">Diese Analyse speichern</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90"
      >
        Zu Portfolio hinzufügen
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface-elevated p-6 text-left">
            {!isPremium ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <p className="font-display text-lg text-text-primary">Portfolio ist ein Premium-Feature</p>
                <p className="font-body text-sm text-text-secondary">
                  Speichere Analysen, kategorisiere sie und erhalte Preisalarme — mit Premium.
                </p>
                <a
                  href="/upgrade"
                  className="inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-5 py-2.5 font-body text-sm font-medium text-on-accent"
                >
                  Premium starten
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="font-body text-sm text-text-tertiary hover:text-text-primary transition-colors duration-200"
                >
                  Schließen
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg text-text-primary">Zu Portfolio hinzufügen</h3>

                <p className="mt-4 font-body text-sm text-text-secondary">Kategorie wählen:</p>
                <div className="mt-2 space-y-2">
                  {CATEGORIES.map((c) => (
                    <label key={c.value} className="flex items-center gap-2 font-body text-sm text-text-primary">
                      <input
                        type="radio"
                        name="category"
                        checked={category === c.value}
                        onChange={() => setCategory(c.value)}
                        className="accent-accent-luminous"
                      />
                      {c.icon} {c.label}
                    </label>
                  ))}
                </div>

                <p className="mt-4 font-body text-sm text-text-secondary">Notiz (optional):</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-border-strong bg-surface px-3 py-2 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
                />

                <label className="mt-4 flex items-center gap-2 font-body text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={alertEnabled}
                    onChange={(e) => setAlertEnabled(e.target.checked)}
                    className="accent-accent-luminous"
                  />
                  Preisänderungs-Alarm: Benachrichtige mich
                </label>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-pill border border-border-strong px-5 py-2.5 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-pill bg-linear-to-r from-accent to-accent-luminous px-5 py-2.5 font-body text-sm font-medium text-on-accent disabled:opacity-50"
                  >
                    {saving ? 'Speichert…' : 'Speichern'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
