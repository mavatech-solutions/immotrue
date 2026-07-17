import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { detectPortal, getPortalById } from '../../../../shared/utils/portalDetector';
import type { Alert } from '../../../../shared/types/index';
import { useAlerts, type NewAlert } from '../../hooks/useAlerts';
import AlertFormModal from './AlertFormModal';

const queryClient = new QueryClient();

const MAX_ACTIVE_ALERTS = 5;

async function fetchIsPremium(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login?redirect=/alerts';
    throw new Error('not authenticated');
  }
  const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', session.user.id).single();
  return profile?.is_premium ?? false;
}

function criteriaSummary(alert: Alert): string {
  const parts: string[] = [];
  if (alert.city) parts.push(alert.city);
  if (alert.min_rooms) parts.push(`${alert.min_rooms}${alert.min_rooms >= 5 ? '+' : ''}-Zi`);
  if (alert.max_price) parts.push(`bis €${alert.max_price.toLocaleString('de-DE')}`);
  const portalNames = (alert.portals ?? []).map((id) => getPortalById(id)?.name).filter(Boolean);
  if (portalNames.length > 0) parts.push(portalNames.join(' + '));
  return parts.length > 0 ? parts.join(', ') : 'Keine Kriterien festgelegt';
}

function LockedState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-border-subtle bg-surface-elevated py-24 text-center">
      <span className="text-5xl">🔔</span>
      <h1 className="font-display text-2xl text-text-primary">Wunschalarm ist Premium</h1>
      <p className="max-w-md font-body text-sm text-text-secondary">
        Sei der Erste bei neuen Objekten — lass dich benachrichtigen, sobald ein passendes Inserat online geht.
      </p>
      <a
        href="/upgrade"
        className="mt-2 inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90"
      >
        Premium starten
      </a>
    </div>
  );
}

function AlertCard({
  alert,
  matchCount,
  onToggle,
  onEdit,
  onDelete,
}: {
  alert: Alert;
  matchCount: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border-subtle bg-surface-elevated p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg text-text-primary">{alert.name ?? 'Unbenannter Alarm'}</h3>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={alert.active} onChange={onToggle} className="peer sr-only" />
          <div className="h-6 w-11 rounded-pill bg-border-strong transition-colors duration-200 peer-checked:bg-accent-luminous" />
          <div className="absolute left-1 h-4 w-4 rounded-pill bg-surface-elevated transition-transform duration-200 peer-checked:translate-x-5" />
        </label>
      </div>

      <p className="font-body text-sm text-text-secondary">{criteriaSummary(alert)}</p>
      <p className="font-body text-xs text-text-tertiary">{matchCount} Treffer diesen Monat</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center rounded-pill border border-border-strong px-4 py-2 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous"
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-pill border border-border-strong px-4 py-2 font-body text-sm text-verdict-overpriced transition-colors duration-200 hover:border-verdict-overpriced"
        >
          Löschen
        </button>
      </div>
    </div>
  );
}

function PremiumAlertsView() {
  const { alerts, isLoading, isError, error, recentMatches, matchCounts, create, update, remove, isSaving } = useAlerts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Alert | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeCount = alerts.filter((a) => a.active).length;
  const canCreate = activeCount < MAX_ACTIVE_ALERTS;

  // Mirrors the DB trigger's rule (max 2 active alerts using ImmoScout24 or
  // Immowelt) so the form can disable those checkboxes proactively instead
  // of letting the user hit a save error — excludes the alert being edited
  // so re-saving it with the same portals doesn't get blocked by itself.
  const otherPaidPortalActiveCount = alerts.filter(
    (a) => a.active && a.id !== editing?.id && (a.portals ?? []).some((p) => p === 'immoscout' || p === 'immowelt'),
  ).length;
  const paidPortalCapReached = otherPaidPortalActiveCount >= 2;

  async function handleSave(data: NewAlert) {
    setSaveError(null);
    try {
      if (editing) await update(editing.id, data);
      else await create(data);
      setModalOpen(false);
      setEditing(null);
    } catch (error) {
      setSaveError((error as Error).message);
    }
  }

  async function handleDelete(alert: Alert) {
    if (!window.confirm(`Alarm "${alert.name ?? 'Unbenannter Alarm'}" wirklich löschen?`)) return;
    await remove(alert.id);
  }

  async function handleToggle(alert: Alert) {
    try {
      await update(alert.id, { active: !alert.active });
    } catch (error) {
      window.alert((error as Error).message);
    }
  }

  if (isLoading) return <p className="py-24 text-center font-body text-text-secondary">Lädt…</p>;
  if (isError) return <p className="py-24 text-center font-body text-verdict-overpriced">{error?.message ?? 'Unerwarteter Fehler.'}</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl md:text-3xl text-text-primary">Meine Alarme</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setSaveError(null);
            setModalOpen(true);
          }}
          disabled={!canCreate}
          title={canCreate ? undefined : `Maximal ${MAX_ACTIVE_ALERTS} aktive Alarme`}
          className="inline-flex items-center justify-center rounded-pill bg-linear-to-r from-accent to-accent-luminous px-6 py-3 font-body text-sm font-medium text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Neuer Alarm
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border-subtle bg-surface-elevated py-24 text-center">
          <p className="font-body text-text-secondary">Noch keine Alarme eingerichtet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              matchCount={matchCounts[alert.id] ?? 0}
              onToggle={() => handleToggle(alert)}
              onEdit={() => {
                setEditing(alert);
                setSaveError(null);
                setModalOpen(true);
              }}
              onDelete={() => handleDelete(alert)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-text-primary">Letzte Treffer</h2>
        {recentMatches.length === 0 ? (
          <p className="font-body text-sm text-text-tertiary">Noch keine Treffer.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentMatches.map((match) => {
              const portal = detectPortal(match.listing_url);
              return (
                <div
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-elevated p-4"
                >
                  <div className="flex items-center gap-3 font-body text-sm text-text-primary">
                    <span>{portal?.flag ?? '🏠'}</span>
                    <span className="text-text-secondary">{portal?.name ?? 'Unbekanntes Portal'}</span>
                    <span className="text-text-tertiary">· {new Date(match.alerted_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  <a
                    href={`/analyse?url=${encodeURIComponent(match.listing_url)}`}
                    className="inline-flex items-center justify-center rounded-pill border border-border-strong px-4 py-2 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous"
                  >
                    Analysieren
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <AlertFormModal
          editing={editing}
          saving={isSaving}
          error={saveError}
          paidPortalDisabled={paidPortalCapReached}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function AlertsScreenInner() {
  const { data: isPremium, isLoading } = useQuery({ queryKey: ['alerts-is-premium'], queryFn: fetchIsPremium });

  if (isLoading) return <p className="py-24 text-center font-body text-text-secondary">Lädt…</p>;
  if (!isPremium) return <LockedState />;
  return <PremiumAlertsView />;
}

export default function AlertsScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlertsScreenInner />
    </QueryClientProvider>
  );
}
