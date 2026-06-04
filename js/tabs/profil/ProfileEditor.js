import { html, useState, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { assessDeficit } from '../../calc/nutritionLogic.js';
import { calcLeanMass, calcBMR } from '../../calc/bmr.js';
import { calcTDEE, calcMacros, calcProteinTarget } from '../../calc/macros.js';

// WICHTIG: Field MUSS außerhalb von ProfileEditor definiert sein.
// Wenn Field innerhalb definiert wird, erstellt React bei jedem Re-Render
// eine neue Komponente → Input verliert sofort den Fokus.
function Field({ label, field, type, min, max, step, suffix, form, update, borderOverride }) {
  const t = type || 'number';
  const s = step || '1';
  return html`
    <div style=${{ marginBottom: '12px' }}>
      <label style=${S.label}>${label}${suffix ? ` (${suffix})` : ''}</label>
      <input
        type=${t}
        value=${form[field] ?? ''}
        min=${min}
        max=${max}
        step=${s}
        onChange=${e => update(field, e.target.value)}
        style=${{ ...S.input, ...(borderOverride ? { borderColor: borderOverride } : {}) }}
      />
    </div>
  `;
}

export function ProfileEditor({ profile, calculated, onSave }) {
  // fatPercent intern als Dezimal (0.25), im Formular als Prozent (25)
  const [form, setForm] = useState({
    ...profile,
    fatPercent: Math.round((profile.fatPercent || 0.25) * 100),
    wakeUpTime: profile.wakeUpTime || '07:00',
    trainingDurationMin: profile.trainingDurationMin || 60,
  });
  const [dirty, setDirty] = useState(false);

  const preview = useMemo(() => {
    if (!form.weight || !form.bodyFat) return null;
    try {
      const leanMass = calcLeanMass(Number(form.weight), Number(form.bodyFat));
      const bmr = calcBMR(leanMass);
      const patchedProfile = {
        ...form,
        leanMass,
        weight: Number(form.weight),
        bodyFat: Number(form.bodyFat),
        deficit: Number(form.deficit) || 0,
        trainingFactor: Number(form.trainingFactor) || 1.55,
        proteinPerKg: Number(form.proteinPerKg) || 1.9,
        fatPercent: (Number(form.fatPercent) || 25) / 100,  // Prozent → Dezimal
      };
      const tdeeTraining = calcTDEE(bmr, patchedProfile.trainingFactor);
      const targetKcal = tdeeTraining - patchedProfile.deficit;
      const macros = calcMacros(patchedProfile, targetKcal);
      const proteinTarget = calcProteinTarget(patchedProfile);
      const deficitAssessment = assessDeficit(patchedProfile, tdeeTraining);
      return { leanMass, bmr, tdeeTraining, targetKcal, macros, proteinTarget, deficitAssessment };
    } catch { return null; }
  }, [form]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function handleSave() {
    const p = {
      ...profile,
      ...form,
      weight: Number(form.weight),
      height: Number(form.height),
      age: Number(form.age),
      bodyFat: Number(form.bodyFat),
      deficit: Number(form.deficit) || 300,
      proteinPerKg: Number(form.proteinPerKg) || 1.9,
      trainingFactor: Number(form.trainingFactor) || 1.55,
      restFactor: Number(form.restFactor) || 1.35,
      fatPercent: (Number(form.fatPercent) || 25) / 100,  // Prozent → Dezimal speichern
      strengthTrainingDaysPerWeek: Number(form.strengthTrainingDaysPerWeek) || 3,
      wakeUpTime: form.wakeUpTime || '07:00',
      trainingDurationMin: Number(form.trainingDurationMin) || 60,
      leanMass: calcLeanMass(Number(form.weight), Number(form.bodyFat)),
    };
    onSave(p);
    setDirty(false);
  }

  const severityColor = {
    safe: COLORS.success,
    moderate: COLORS.gold,
    aggressive: '#e08c5c',
    dangerous: COLORS.error,
  };

  const defSeverity = preview?.deficitAssessment?.severity;
  const deficitBorderColor = defSeverity === 'dangerous' ? COLORS.error
    : defSeverity === 'aggressive' ? '#e08c5c'
    : undefined;

  return html`
    <div style=${S.card}>
      <div style=${S.cardTitle}>Profil bearbeiten</div>

      <${Field} label="Name" field="name" type="text" form=${form} update=${update} />
      <${Field} label="Gewicht" field="weight" suffix="kg" min="30" max="300" step="0.1" form=${form} update=${update} />
      <${Field} label="Größe" field="height" suffix="cm" min="100" max="250" form=${form} update=${update} />
      <${Field} label="Alter" field="age" suffix="Jahre" min="18" max="100" form=${form} update=${update} />
      <${Field} label="Körperfettanteil" field="bodyFat" suffix="%" min="5" max="70" step="0.1" form=${form} update=${update} />

      <div style=${{ marginBottom: '12px' }}>
        <label style=${S.label}>Protein-Zielmodus</label>
        <select
          value=${form.proteinTargetMode || 'perKgBodyweight'}
          onChange=${e => update('proteinTargetMode', e.target.value)}
          style=${S.input}
        >
          <option value="perKgBodyweight">Pro kg Körpergewicht</option>
          <option value="perKgLeanMass">Pro kg Muskelmasse</option>
          <option value="fixed">Fester Wert (g)</option>
        </select>
      </div>

      <${Field}
        label=${form.proteinTargetMode === 'fixed' ? 'Protein gesamt' : 'Protein g/kg'}
        field="proteinPerKg"
        suffix=${form.proteinTargetMode === 'fixed' ? 'g' : 'g/kg'}
        min="0.8" max="300" step="0.1"
        form=${form} update=${update}
      />

      <div style=${{ marginBottom: '12px' }}>
        <label style=${S.label}>Kaloriendefizit (kcal/Tag)</label>
        <input
          type="number"
          value=${form.deficit ?? 300}
          min="0" max="1000"
          onChange=${e => update('deficit', e.target.value)}
          style=${{ ...S.input, ...(deficitBorderColor ? { borderColor: deficitBorderColor } : {}) }}
        />
        ${preview?.deficitAssessment && ['aggressive', 'dangerous'].includes(preview.deficitAssessment.severity) && html`
          <div style=${{
            marginTop: '6px', padding: '8px 10px', borderRadius: '6px', fontSize: '11px',
            background: preview.deficitAssessment.severity === 'dangerous' ? '#3a1515' : '#2a1f10',
            color: severityColor[preview.deficitAssessment.severity],
            border: `1px solid ${severityColor[preview.deficitAssessment.severity]}`
          }}>
            ⚠️ ${preview.deficitAssessment.warning}
          </div>
        `}
      </div>

      <${Field} label="Fettanteil" field="fatPercent" suffix="%" min="10" max="55" step="1" form=${form} update=${update} />
      <${Field} label="PAL Trainingstag" field="trainingFactor" min="1.2" max="2.0" step="0.05" form=${form} update=${update} />
      <${Field} label="PAL Ruhetag" field="restFactor" min="1.2" max="2.0" step="0.05" form=${form} update=${update} />
      <${Field} label="Krafttraining-Tage/Woche" field="strengthTrainingDaysPerWeek" min="0" max="7" form=${form} update=${update} />

      <div style=${{ marginBottom: '12px' }}>
        <label style=${S.label}>Aufwachzeit</label>
        <input
          type="time"
          value=${form.wakeUpTime || '07:00'}
          onChange=${e => update('wakeUpTime', e.target.value)}
          style=${S.input}
        />
      </div>
      <${Field} label="Trainingsdauer" field="trainingDurationMin" suffix="Min" min="20" max="180" step="5" form=${form} update=${update} />

      ${preview && html`
        <div style=${{ background: '#0d0d0d', borderRadius: '8px', padding: '12px', marginBottom: '14px', border: '1px solid #1e1e1e' }}>
          <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vorschau</div>
          <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            ${[
              { label: 'BMR', value: `${preview.bmr} kcal` },
              { label: 'TDEE Training', value: `${preview.tdeeTraining} kcal` },
              { label: 'Zielkalorien', value: `${preview.targetKcal} kcal` },
              { label: 'Proteinziel', value: `${preview.proteinTarget} g` },
            ].map(({ label, value }) => html`
              <div key=${label} style=${S.statBox}>
                <div style=${{ fontSize: '9px', color: COLORS.textMuted, fontFamily: FONTS.mono, textTransform: 'uppercase' }}>${label}</div>
                <div style=${{ fontSize: '14px', fontWeight: 700, color: COLORS.gold }}>${value}</div>
              </div>
            `)}
          </div>
        </div>
      `}

      <button
        onClick=${handleSave}
        disabled=${!dirty}
        style=${{ ...S.btn(dirty ? COLORS.gold : '#333', dirty ? '#111' : '#666'), width: '100%' }}
      >
        Profil speichern
      </button>
    </div>
  `;
}
