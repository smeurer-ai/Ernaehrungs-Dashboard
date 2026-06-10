import { html, useState, useEffect, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';
import { FavoritePicker } from './FavoritePicker.js';
import { OFFSearchPanel } from './OFFSearchPanel.js';
import { BarcodePanel } from './BarcodePanel.js';
import { calcTrackedFoodMacros, computeSlotGap } from '../../calc/tracker.js';
import { isMainMealSlot } from '../../calc/nutritionLogic.js';
import { computeMpsFields } from '../../calc/leucineFactors.js';

/** Generiert eine einfache, eindeutige ID */
function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Fallback-Liste wenn keine mealSlots-Prop übergeben wird
const DEFAULT_MEAL_SLOTS = [
  'Frühstück', 'Pre-Workout', 'Post-Workout',
  'Mittagessen', 'Nachmittagssnack', 'Abendessen', 'Snack',
];

/**
 * Modal für Mahlzeit-Eingabe (manuell oder aus Favoriten).
 *
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   onSave: function,           // (trackedFood, saveFavorite?) => void
 *   favorites: FavoriteFood[],
 *   initialEntry?: TrackedFood, // wenn gesetzt: Edit-Modus
 *   defaultSlot?: string,
 *   mealSlots?: string[],       // dynamische Slot-Namen aus TrackerTab
 * }} props
 */
export function FoodEntryModal({ open, onClose, onSave, favorites, initialEntry, defaultSlot, mealSlots, slotTargets, consumedBySlot }) {
  const isEdit = !!initialEntry;
  // mealSlots?.length statt ?? — leeres Array fällt auf Default zurück
  const slots = mealSlots?.length ? mealSlots : DEFAULT_MEAL_SLOTS;
  // Slot-Priorität: initialEntry.mealSlot → defaultSlot → slots[0]
  const initialSlot = slots.includes(initialEntry?.mealSlot)
    ? initialEntry.mealSlot
    : slots.includes(defaultSlot)
      ? defaultSlot
      : slots[0];

  const [slot, setSlot] = useState(initialSlot);
  const [name, setName] = useState('');
  const [gramm, setGramm] = useState('');
  const [kcal100, setKcal100] = useState('');
  const [p100, setP100] = useState('');
  const [c100, setC100] = useState('');
  const [f100, setF100] = useState('');
  const [saveFav, setSaveFav] = useState(false);
  const [searchMode, setSearchMode] = useState(null); // null | 'search' | 'barcode'
  const [offData, setOffData] = useState(null);        // { categoriesTags, offCode } | null
  const [justSavedName, setJustSavedName] = useState(null); // zuletzt mit „+ weitere" gespeichert

  // Formular zurücksetzen / mit initialEntry befüllen wenn Modal geöffnet wird.
  // Im Edit-Modus: Per-100g-Werte aus vorhandenem Eintrag zurückrechnen
  // (factor = 100 / entry.gramm → entry.kcal * factor = kcal100).
  useEffect(() => {
    if (!open) return;
    // Slot-Priorität: initialEntry.mealSlot → defaultSlot → slots[0]
    // slots wird aus mealSlots abgeleitet (in dep-Array), kein hardcoded MEAL_SLOTS
    const safeSlot = slots.includes(initialEntry?.mealSlot)
      ? initialEntry.mealSlot
      : slots.includes(defaultSlot)
        ? defaultSlot
        : slots[0];

    if (initialEntry) {
      const f = initialEntry.gramm > 0 ? 100 / initialEntry.gramm : 0;
      setSlot(safeSlot);
      setName(initialEntry.foodName);
      setGramm(String(initialEntry.gramm));
      setKcal100(String(Math.round(initialEntry.kcal * f)));
      setP100(String(Math.round(initialEntry.p * f * 10) / 10));
      setC100(String(Math.round(initialEntry.c * f * 10) / 10));
      setF100(String(Math.round(initialEntry.f * f * 10) / 10));
      setSaveFav(false);
    } else {
      setSlot(safeSlot);
      setName('');
      setGramm('');
      setKcal100('');
      setP100('');
      setC100('');
      setF100('');
      setSaveFav(false);
      setSearchMode(null);
      setOffData(null);
      setJustSavedName(null);
    }
  }, [open, initialEntry, defaultSlot, mealSlots]);

  const handleFavSelect = (fav) => {
    setName(fav.name);
    setKcal100(String(fav.kcal100));
    setP100(String(fav.p100));
    setC100(String(fav.c100));
    setF100(String(fav.f100));
    setSaveFav(false);
    setOffData(null);
  };

  const handleOFFSelect = (product) => {
    setName(product.name);
    setGramm(current => current || '100');
    setKcal100(String(product.kcal100));
    setP100(String(product.p100));
    setC100(String(product.c100));
    setF100(String(product.f100));
    setOffData({ categoriesTags: product.categoriesTags, offCode: product.offCode });
    // saveFav NICHT zurücksetzen — Nutzerin soll selbst entscheiden ob Favorit gespeichert wird
  };

  // Live-Vorschau der Makros
  const preview = useMemo(() => {
    const g = parseFloat(gramm);
    const k = parseFloat(kcal100);
    const p = parseFloat(p100);
    const c = parseFloat(c100);
    const f = parseFloat(f100);
    if (!g || isNaN(g) || isNaN(k) || k < 0) return null;
    return calcTrackedFoodMacros(
      { kcal100: k || 0, p100: p || 0, c100: c || 0, f100: f || 0 },
      g,
    );
  }, [gramm, kcal100, p100, c100, f100]);

  const canSave = name.trim() && parseFloat(gramm) > 0 && preview !== null;

  // Slot-Ziel + verbleibende Lücke (nur Neueingabe; im Edit-Modus wäre die
  // Summe verfälscht, weil der bearbeitete Eintrag schon mitgezählt ist)
  const slotTarget = !isEdit ? slotTargets?.[slot] : null;
  const slotConsumed = consumedBySlot?.[slot] ?? { kcal: 0, p: 0, c: 0, f: 0 };
  const slotGap = slotTarget ? computeSlotGap(slotTarget, slotConsumed, preview ?? {}) : null;
  const slotGapMet = slotGap != null && slotGap.kcal === 0 && slotGap.p === 0 && slotGap.c === 0 && slotGap.f === 0;
  const isMainSlot = isMainMealSlot(slot);
  const slotProteinSoFar = Math.round((slotConsumed.p + (preview?.p ?? 0)) * 10) / 10;

  /**
   * @param {boolean} keepOpen - true = „Eintragen + weitere": speichert und
   *   leert das Formular für das nächste Lebensmittel; der Mahlzeit-Slot bleibt.
   */
  function handleSave(keepOpen = false) {
    if (!canSave) return;

    const entry = {
      id: initialEntry?.id ?? generateId(),
      mealSlot: slot,
      foodName: name.trim(),
      foodRef: offData ? `off:${offData.offCode || 'search'}` : 'manual',
      gramm: parseFloat(gramm),
      kcal: preview.kcal,
      p: preview.p,
      c: preview.c,
      f: preview.f,
      timestamp: initialEntry?.timestamp ?? Date.now(),
    };

    if (offData) {
      const { leucineEstimateG, proteinQualityScore, mpsTriggered } = computeMpsFields(preview.p, offData.categoriesTags);
      entry.leucineEstimateG = leucineEstimateG;
      entry.proteinQualityScore = proteinQualityScore;
      entry.mpsTriggered = mpsTriggered;
    }

    const nameKey = name.trim().toLowerCase();
    const isDuplicate = favorites.some(f => f.name.trim().toLowerCase() === nameKey);
    const favData = (saveFav && !isDuplicate) ? {
      id: generateId(),
      name: name.trim(),
      kcal100: parseFloat(kcal100) || 0,
      p100: parseFloat(p100) || 0,
      c100: parseFloat(c100) || 0,
      f100: parseFloat(f100) || 0,
      ...(offData ? { source: 'off', offCode: offData.offCode } : { source: 'manual' }),
    } : null;

    onSave(entry, favData);

    if (!keepOpen) {
      onClose();
      return;
    }

    // Formular für das nächste Lebensmittel leeren — Slot bleibt erhalten
    setJustSavedName(name.trim());
    setName('');
    setGramm('');
    setKcal100('');
    setP100('');
    setC100('');
    setF100('');
    setSaveFav(false);
    setSearchMode(null);
    setOffData(null);
  }

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onClose}>
      <div style=${{ padding: '4px 0' }}>
        <!-- Titel -->
        <div style=${{ ...S.cardTitle, fontSize: '12px', marginBottom: '14px' }}>
          ${isEdit ? 'Eintrag bearbeiten' : 'Mahlzeit eintragen'}
        </div>

        <!-- Mahlzeit-Slot -->
        <label style=${S.label}>Mahlzeit</label>
        <select
          value=${slot}
          onChange=${e => setSlot(e.target.value)}
          style=${{ ...S.input, marginBottom: slotTarget ? '8px' : '14px' }}
        >
          ${slots.map(s => html`<option key=${s} value=${s}>${s}</option>`)}
        </select>

        ${slotTarget && html`
          <div style=${{
            background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px',
            padding: '8px 12px', marginBottom: '14px',
            fontFamily: FONTS.mono, fontSize: '11px', lineHeight: 1.7,
          }}>
            <div style=${{ color: COLORS.textMuted }}>
              Ziel: ${slotTarget.kcal} kcal · P ${slotTarget.p}g · KH ${slotTarget.c}g · F ${slotTarget.f}g
            </div>
            ${(slotConsumed.kcal > 0 || slotConsumed.p > 0) && html`
              <div style=${{ color: COLORS.textMuted }}>
                Schon eingetragen: ${Math.round(slotConsumed.kcal)} kcal · P ${Math.round(slotConsumed.p * 10) / 10}g · KH ${Math.round(slotConsumed.c * 10) / 10}g · F ${Math.round(slotConsumed.f * 10) / 10}g
              </div>
            `}
            ${slotGapMet
              ? html`<div style=${{ color: '#5cb85c' }}>✓ Slot-Ziel erreicht</div>`
              : html`
                <div style=${{ color: COLORS.gold }}>
                  Noch offen${preview ? ' (mit dieser Eingabe)' : ''}: ${slotGap.kcal} kcal · P ${slotGap.p}g · KH ${slotGap.c}g · F ${slotGap.f}g
                </div>
              `}
            ${isMainSlot && html`
              <div style=${{ color: slotProteinSoFar >= 30 ? '#5cb85c' : '#c8a830' }}>
                ${slotProteinSoFar >= 30
                  ? `✓ MPS: ~30g Protein erreicht (${slotProteinSoFar}g)`
                  : `MPS-Trigger braucht ~30g Protein — aktuell ${slotProteinSoFar}g`}
              </div>
            `}
          </div>
        `}

        ${justSavedName && html`
          <div style=${{
            fontSize: '11px', color: '#5cb85c', fontFamily: FONTS.mono,
            marginBottom: '10px', padding: '6px 10px', background: '#1a2a1a',
            borderRadius: '6px', border: '1px solid #2a3a2a',
          }}>
            ✓ „${justSavedName}" eingetragen — nächstes Lebensmittel:
          </div>
        `}

        <!-- Favoriten-Picker (nur im Neueingabe-Modus) -->
        ${!isEdit && html`
          <label style=${{ ...S.label, marginBottom: '6px' }}>Aus Favoriten</label>
          <${FavoritePicker} favorites=${favorites} onSelect=${handleFavSelect} />

          <div style=${{ display: 'flex', gap: '6px', margin: '10px 0 8px' }}>
            <button
              onClick=${() => setSearchMode(searchMode === 'search' ? null : 'search')}
              style=${{
                ...S.btn(searchMode === 'search' ? COLORS.gold : '#1e1e1e', searchMode === 'search' ? '#111' : COLORS.textMuted),
                flex: 1,
                fontSize: '11px',
              }}
            >🔍 OFD Suche</button>
            <button
              onClick=${() => setSearchMode(searchMode === 'barcode' ? null : 'barcode')}
              style=${{
                ...S.btn(searchMode === 'barcode' ? COLORS.gold : '#1e1e1e', searchMode === 'barcode' ? '#111' : COLORS.textMuted),
                flex: 1,
                fontSize: '11px',
              }}
            >🔢 Barcode</button>
          </div>

          ${searchMode === 'search' && html`
            <${OFFSearchPanel} onSelect=${handleOFFSelect} onClose=${() => setSearchMode(null)} />
          `}
          ${searchMode === 'barcode' && html`
            <${BarcodePanel}
              onSelect=${handleOFFSelect}
              onSelectFavorite=${fav => { handleFavSelect(fav); setGramm(current => current || '100'); }}
              favorites=${favorites}
              onClose=${() => setSearchMode(null)}
            />
          `}

          ${offData && html`
            <div style=${{
              fontSize: '10px', color: '#5cb85c', fontFamily: FONTS.mono,
              marginBottom: '8px', padding: '4px 8px', background: '#1a2a1a',
              borderRadius: '6px', border: '1px solid #2a3a2a',
            }}>
              ✓ OFD-Produkt · Leucin wird automatisch berechnet
            </div>
          `}

          <div style=${{
            textAlign: 'center',
            fontSize: '10px',
            color: COLORS.textMuted,
            fontFamily: FONTS.mono,
            margin: '6px 0 12px',
            letterSpacing: '0.08em',
          }}>— oder manuell eingeben —</div>
        `}

        <!-- Name -->
        <label style=${S.label}>Name</label>
        <input
          type="text"
          value=${name}
          placeholder="z.B. Magerquark"
          onInput=${e => setName(e.target.value)}
          style=${{ ...S.input, marginBottom: '10px' }}
        />

        <!-- Gramm -->
        <label style=${S.label}>Menge (g)</label>
        <input
          type="number"
          value=${gramm}
          placeholder="z.B. 200"
          min="1"
          onInput=${e => setGramm(e.target.value)}
          style=${{ ...S.input, marginBottom: '10px' }}
        />

        <!-- Makros pro 100g -->
        <label style=${{ ...S.label, marginBottom: '6px' }}>Makros pro 100g</label>
        <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          ${[
            ['kcal/100g', kcal100, setKcal100],
            ['P/100g',    p100,    setP100],
            ['KH/100g',   c100,    setC100],
            ['F/100g',    f100,    setF100],
          ].map(([lbl, val, set]) => html`
            <div key=${lbl}>
              <label style=${{ ...S.label, fontSize: '10px' }}>${lbl}</label>
              <input
                type="number"
                value=${val}
                min="0"
                step="0.1"
                onInput=${e => set(e.target.value)}
                style=${S.input}
              />
            </div>
          `)}
        </div>

        <!-- Vorschau -->
        ${preview && html`
          <div style=${{
            background: '#1a1a12',
            border: `1px solid ${COLORS.gold}33`,
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '14px',
            fontFamily: FONTS.mono,
            fontSize: '12px',
            color: COLORS.text,
          }}>
            ${preview.kcal} kcal · ${preview.p}g P · ${preview.c}g KH · ${preview.f}g F
          </div>
        `}

        <!-- Als Favorit speichern -->
        <label style=${{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          cursor: 'pointer',
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: FONTS.mono,
        }}>
          <input
            type="checkbox"
            checked=${saveFav}
            onChange=${e => setSaveFav(e.target.checked)}
            style=${{ accentColor: COLORS.gold }}
          />
          Als Favorit speichern
        </label>

        <!-- Buttons -->
        ${!isEdit && html`
          <button
            onClick=${() => handleSave(true)}
            disabled=${!canSave}
            style=${{
              background: 'none',
              border: `1px solid ${canSave ? COLORS.gold : '#333'}`,
              borderRadius: '8px', width: '100%', padding: '10px',
              color: canSave ? COLORS.gold : '#666',
              cursor: canSave ? 'pointer' : 'default',
              fontSize: '13px', fontFamily: FONTS.mono, marginBottom: '8px',
            }}
          >
            ✓ Eintragen + weitere hinzufügen
          </button>
        `}
        <div style=${{ display: 'flex', gap: '8px' }}>
          <button
            onClick=${onClose}
            style=${{ ...S.btn('#222', COLORS.text), flex: 1 }}
          >
            ${justSavedName ? 'Fertig' : 'Abbrechen'}
          </button>
          <button
            onClick=${() => handleSave(false)}
            disabled=${!canSave}
            style=${{
              ...S.btn(canSave ? COLORS.gold : '#333', canSave ? '#111' : '#666'),
              flex: 1,
            }}
          >
            ${isEdit ? 'Speichern' : 'Eintragen'}
          </button>
        </div>
      </div>
    </${Modal}>
  `;
}
