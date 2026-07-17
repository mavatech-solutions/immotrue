import { useState } from 'react';
import { getAllPortals } from '../../../../shared/utils/portalDetector';
import type { Alert, NotificationFrequency } from '../../../../shared/types/index';
import type { NewAlert } from '../../hooks/useAlerts';

const RADIUS_OPTIONS = [5, 10, 20, 50];
const ROOM_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5+' },
];
const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'wohnung', label: 'Wohnung' },
  { value: 'haus', label: 'Haus' },
  { value: 'beides', label: 'Beides' },
];

function segmentClass(active: boolean): string {
  return `rounded-pill border px-4 py-2 font-body text-sm transition-colors duration-200 ${
    active ? 'border-accent-luminous text-accent-luminous' : 'border-border-strong text-text-secondary hover:border-accent-luminous'
  }`;
}

const PAID_PORTAL_IDS = ['immoscout', 'immowelt'];

export default function AlertFormModal({
  editing,
  onClose,
  onSave,
  saving,
  error,
  paidPortalDisabled,
}: {
  editing: Alert | null;
  onClose: () => void;
  onSave: (data: NewAlert) => Promise<void>;
  saving: boolean;
  error: string | null;
  paidPortalDisabled: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [city, setCity] = useState(editing?.city ?? '');
  const [radiusKm, setRadiusKm] = useState(editing?.radius_km ?? 10);
  const [maxPrice, setMaxPrice] = useState(editing?.max_price ?? 500000);
  const [minRooms, setMinRooms] = useState(editing?.min_rooms ?? 2);
  const [propertyType, setPropertyType] = useState(editing?.property_type ?? 'beides');
  const [portals, setPortals] = useState<string[]>(() => {
    const initial = editing?.portals ?? getAllPortals().map((p) => p.id);
    // A new alert while the paid-portal cap is reached starts with those
    // portals unchecked rather than pre-selecting something save would reject.
    if (editing || !paidPortalDisabled) return initial;
    return initial.filter((id) => !PAID_PORTAL_IDS.includes(id));
  });
  const [frequency, setFrequency] = useState<NotificationFrequency>(editing?.notification_frequency ?? 'immediate');

  function togglePortal(id: string) {
    setPortals((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSave({
      name: name || null,
      city: city || null,
      radius_km: radiusKm,
      max_price: maxPrice,
      min_rooms: minRooms,
      property_type: propertyType,
      portals,
      notification_frequency: frequency,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-base/80 p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl border border-border-subtle bg-surface-elevated p-6 text-left"
      >
        <h3 className="font-display text-lg text-text-primary">{editing ? 'Alarm bearbeiten' : 'Neuer Alarm'}</h3>

        <label className="mt-4 block font-body text-sm text-text-secondary">
          Name (optional)
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Erstwohnung München"
            className="mt-2 w-full rounded-xl border border-border-strong bg-surface px-3 py-2 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
          />
        </label>

        <label className="mt-4 block font-body text-sm text-text-secondary">
          Stadt oder PLZ
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="München oder 80331"
            className="mt-2 w-full rounded-xl border border-border-strong bg-surface px-3 py-2 font-body text-sm text-text-primary outline-none focus:border-accent-luminous"
          />
        </label>

        <p className="mt-4 font-body text-sm text-text-secondary">Radius</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <button key={r} type="button" onClick={() => setRadiusKm(r)} className={segmentClass(radiusKm === r)}>
              {r} km
            </button>
          ))}
        </div>

        <label className="mt-4 block font-body text-sm text-text-secondary">
          Max. Preis: €{maxPrice.toLocaleString('de-DE')}
          <input
            type="range"
            min={100000}
            max={2000000}
            step={25000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="mt-2 w-full accent-accent-luminous"
          />
        </label>

        <p className="mt-4 font-body text-sm text-text-secondary">Min. Zimmer</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROOM_OPTIONS.map((r) => (
            <button key={r.value} type="button" onClick={() => setMinRooms(r.value)} className={segmentClass(minRooms === r.value)}>
              {r.label}
            </button>
          ))}
        </div>

        <p className="mt-4 font-body text-sm text-text-secondary">Typ</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((t) => (
            <button key={t.value} type="button" onClick={() => setPropertyType(t.value)} className={segmentClass(propertyType === t.value)}>
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-4 font-body text-sm text-text-secondary">Portale</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {getAllPortals().map((p) => {
            const isPaid = PAID_PORTAL_IDS.includes(p.id);
            const isChecked = portals.includes(p.id);
            const isDisabled = isPaid && paidPortalDisabled && !isChecked;
            return (
              <label
                key={p.id}
                title={isDisabled ? 'Maximal 2 aktive Alarme mit ImmoScout24 oder Immowelt gleichzeitig' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-body text-sm transition-colors duration-200 ${
                  isDisabled ? 'cursor-not-allowed opacity-40 border-border-strong text-text-secondary' : 'cursor-pointer'
                } ${isChecked && !isDisabled ? 'border-accent-luminous text-accent-luminous' : !isDisabled ? 'border-border-strong text-text-secondary' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => togglePortal(p.id)}
                  className="hidden"
                />
                {p.flag} {p.name}
              </label>
            );
          })}
        </div>
        {paidPortalDisabled && (
          <p className="mt-2 font-body text-xs text-text-tertiary">
            ImmoScout24 und Immowelt sind bei diesem Alarm deaktiviert — du hast bereits 2 aktive Alarme mit diesen Portalen (Kostengrenze).
          </p>
        )}

        <p className="mt-4 font-body text-sm text-text-secondary">Benachrichtigung</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => setFrequency('immediate')} className={segmentClass(frequency === 'immediate')}>
            Sofort
          </button>
          <button type="button" onClick={() => setFrequency('daily')} className={segmentClass(frequency === 'daily')}>
            Täglich
          </button>
        </div>

        {error && <p className="mt-4 font-body text-sm text-verdict-overpriced">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-border-strong px-5 py-2.5 font-body text-sm text-text-primary transition-colors duration-200 hover:border-accent-luminous"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving || portals.length === 0}
            className="rounded-pill bg-linear-to-r from-accent to-accent-luminous px-5 py-2.5 font-body text-sm font-medium text-on-accent disabled:opacity-50"
          >
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
