import { html, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { computeMpsSummary } from '../../calc/tracker.js';
import { getMealTemplate } from '../../data/mealTemplates.js';

/**
 * Tages-Karte: „X von Y Mahlzeiten MPS-wirksam".
 * Wird nur gerendert wenn mindestens ein Slot Einträge hat.
 *
 * @param {{
 *   entries: import('../../storage/indexeddb.js').TrackedFood[],
 *   dayType: 'training'|'rest',
 *   trainingTime: string,
 *   wakeUpTime: string,
 *   trainingDurationMin: number,
 * }} props
 */
export function MpsSummaryCard({ entries, dayType, trainingTime, wakeUpTime, trainingDurationMin }) {
  const mealSlots = useMemo(
    () => getMealTemplate(dayType, trainingTime, wakeUpTime, trainingDurationMin).map(m => m.label),
    [dayType, trainingTime, wakeUpTime, trainingDurationMin],
  );

  const { mpsSlotsCount, totalActiveSlotsCount } = computeMpsSummary(entries, mealSlots);

  if (totalActiveSlotsCount === 0) return null;

  const ratio = mpsSlotsCount / totalActiveSlotsCount;
  const barColor = ratio >= 0.75 ? COLORS.success : ratio >= 0.5 ? '#d97706' : COLORS.error;

  const message = mpsSlotsCount === totalActiveSlotsCount
    ? `Alle ${totalActiveSlotsCount} Mahlzeiten MPS-wirksam ✓`
    : `${totalActiveSlotsCount - mpsSlotsCount} Mahlzeit${totalActiveSlotsCount - mpsSlotsCount === 1 ? '' : 'en'} noch unter Leucin-Schwelle`;

  return html`
    <div style=${{ ...S.card, marginTop: '4px' }}>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style=${{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.gold, fontFamily: FONTS.mono, fontWeight: 600 }}>
          MPS-Wirksam heute
        </div>
        <div style=${{ fontSize: '14px', fontFamily: FONTS.mono, fontWeight: 700, color: barColor }}>
          ${mpsSlotsCount} / ${totalActiveSlotsCount}
        </div>
      </div>
      <div style=${{ height: '5px', borderRadius: '3px', background: '#222', overflow: 'hidden', marginBottom: '6px' }}>
        <div style=${{
          height: '100%',
          width: `${Math.round(ratio * 100)}%`,
          background: barColor,
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>
        ${message}
      </div>
    </div>
  `;
}
