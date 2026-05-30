import { html, useState, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { assessDeficit } from '../../calc/nutritionLogic.js';
import { calcLeanMass, calcBMR } from '../../calc/bmr.js';
import { calcTDEE, calcMacros, calcProteinTarget } from '../../calc/macros.js';

export function ProfileEditor({ profile, calculated, onSave }) {
  const [form, setForm] = useState({ ...profile });
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
        fatPercent: Number(form.fatPercent) || 0.25,
      };
      const tdeeTraining = calcTDEE(bmr, patchedProfile.trainingFactor);
      const targetKcal = tdeeTraining - patchedProfile.deficit;
      const macros = calcMacros(patchedProfile, targetKcal);
      const proteinTarget = calcProteinTarget(patchedProfile);
      const deficitAssessment = assessDeficit(patchedProfile, tdeeTraining);
      return { leanMass, bmr, tdeeTraining, targetKcal, macros, proteinTarget, deficitAssessment };
    } catch { return null; }
  }, [form]);

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); setDirty(true); }

  function handleSave() {
    const p = {
      ...profile, ...form,
      weight: Number(form.weight),
      height: Number(form.height),
      age: Number(form.age),
      bodyFat: Number(form.bodyFat),
      deficit: Number(form.deficit) || 300,
      proteinPerKg: Number(form.proteinPerKg) || 1.9,
      trainingFactor: Number(form.trainingFactor) || 1.55,
      restFactor: Number(form.restFactor) || 1.35,
      fatPercent: Number(form.fatPercent) || 0.25,
      strengthTrainingDaysPerWeek: Number(form.strengthTrainingDaysPerWeek) || 3,
      leanMass: calcLeanMass(Number(form.weight), Number(form.bodyFat)),
    };
    onSave(p);
    setDirty(false);
  }

  const severityColor = { safe: COLORS.success, moderate: COLORS.gold, aggressive: '#e08c5c', dangerous: COLORS.error };

  function Field({ label, field, type = 'number', min, max, step = '1', suffix }) {
    return html`
      <div style=${{ marginBottom: '12px' }}>
        <label style=${S.label}>${label}${suffix ? ` (${suffix})` : ''}</label>
        <input type=${type} value=${form[field] ?? ''} min=${min} max=${max} step=${step}
          onChange=${e => update(field, e.target.value)} style=${S.input} />
      </div>
    `;
  }

  return html`
    <div style=${S.card}>
      <div style=${S.cardTitle}>Profil bearbeiten</div>
      <${Field} label="Name" field="name" type="text" />
      <${Field} label="Gewicht" field="weight" suffix="kg" min="30" max="300" step="0.1" />
      <${Field} label="Größe" field="height" suffix="cm" min="100" max="250" />
      <${Field} label="Alter" field="age" suffix="Jahre" min="18" max="100" />
      <${Field} label="Körperfettanteil" field="bodyFat" suffix="%" min="5" max="70" step="0.1" />
      <div style=${{ marginBottom: '12px' }}>
        <label style=${S.label}>Protein-Zielmodus</label>
        <select value=${form.proteinTargetMode || 'perKgBodyweight'} onChange=${e => update('proteinTargetMode', e.target.value)} style=${S.input}>
          <option value="perKgBodyweight">Pro kg Körpergewicht</option>
          <option value="perKgLeanMass">Pro kg Muskelmasse</option>
          <option value="fixed">Fester Wert (g)</option>
        </select>
      </div>
      <${Field} label=${form.proteinTargetMode === 'fixed' ? 'Protein gesamt' : 'Protein g/kg'} field="proteinPerKg" suffix=${form.proteinTargetMode === 'fixed' ? 'g' : 'g/kg'} min="0.8" max="300" step="0.1" />
      <div style=${{ marginBottom: '12px' }}>
        <label style=${S.label}>Kaloriendefizit (kcal/Tag)</label>
        <input type="number" value=${form.deficit ?? 300} min="0" max="1000"
          onChange=${e => update('deficit', e.target.value)}
          style=${{ ...S.input, borderColor: preview?.deficitAssessment?.severity === 'dangerous' ? COLORS.error : preview?.deficitAssessment?.severity === 'aggressive' ? '#e08c5c' : '#2a2a2a' }} />
        ${preview?.deficitAssessment && ['aggressive', 'dangerous'].includes(preview.deficitAssessment.severity) && html`
          <div style=${{ marginTop: '6px', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', background: preview.deficitAssessment.severity === 'dangerous' ? '#3a1515' : '#2a1f10', color: severityColor[preview.deficitAssessment.severity], border: `1px solid ${severityColor[preview.deficitAssessment.severity]}` }}>
            ⚠️ ${preview.deficitAssessment.warning}
          </div>
        `}
      </div>
      <${Field} label="Fettanteil" field="fatPercent" suffix="%" min="15" max="45" step="0.01" />
      <${Field} label="PAL Trainingstag" field="trainingFactor" min="1.2" max="2.0" step="0.05" />
      <${Field} label="PAL Ruhetag" field="restFactor" min="1.2" max="2.0" step="0.05" />
      <${Field} label="Krafttraining-Tage/Woche" field="strengthTrainingDaysPerWeek" min="0" max="7" />
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
      <button onClick=${handleSave} disabled=${!dirty} style=${{ ...S.btn(dirty ? COLORS.gold : '#333', dirty ? '#111' : '#666'), width: '100%' }}>
        Profil speichern
      </button>
    </div>
  `;
}
