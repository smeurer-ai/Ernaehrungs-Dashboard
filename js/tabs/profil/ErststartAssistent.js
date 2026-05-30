import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { calcLeanMass } from '../../calc/bmr.js';

export function ErststartAssistent({ onComplete }) {
  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  function handleFinish(skipBodyFat = false) {
    const bf = skipBodyFat ? 40.0 : parseFloat(bodyFat);
    const w = parseFloat(weight);
    const leanMass = calcLeanMass(w, bf);
    onComplete({
      id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      name: '', weight: w, height: parseFloat(height), age: parseInt(age), bodyFat: bf, leanMass,
      deficit: 300, proteinPerKg: 1.9, proteinTargetMode: 'perKgBodyweight',
      trainingFactor: 1.55, restFactor: 1.35, fatPercent: 0.25, strengthTrainingDaysPerWeek: 3,
      createdAt: Date.now(), updatedAt: Date.now(),
      deviceId: localStorage.getItem('ernaehrung_device_id') || '',
    });
  }

  const stepConfig = [
    { icon: '⚖️', title: 'Wie viel wiegst du?', unit: 'kg', value: weight, setValue: setWeight, min: 30, next: () => setStep(2), valid: parseFloat(weight) >= 30 },
    { icon: '📏', title: 'Wie groß bist du?', unit: 'cm', value: height, setValue: setHeight, min: 100, next: () => setStep(3), valid: parseFloat(height) >= 100 },
    { icon: '🎂', title: 'Wie alt bist du?', unit: 'Jahre', value: age, setValue: setAge, min: 18, next: () => setStep(4), valid: parseInt(age) >= 18 },
  ];

  const dots = html`
    <div style=${{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
      ${[1, 2, 3, 4].map(s => html`
        <div key=${s} style=${{ width: '8px', height: '8px', borderRadius: '50%', background: s <= step ? COLORS.gold : '#333', transition: 'background 0.3s' }} />
      `)}
    </div>
  `;

  if (step <= 3) {
    const cfg = stepConfig[step - 1];
    return html`
      <div style=${{ minHeight: '100vh', background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style=${{ textAlign: 'center', marginBottom: '40px' }}>
          <div style=${{ fontSize: '32px', marginBottom: '8px' }}>🥗</div>
          <div style=${{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: 700, color: COLORS.text }}>Ernährungs-Tool</div>
          <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '4px' }}>Für postmenopausale Frauen mit Krafttraining</div>
        </div>
        ${dots}
        <div style=${{ ...S.card, width: '100%', maxWidth: '360px' }}>
          <div style=${{ textAlign: 'center', marginBottom: '24px' }}>
            <div style=${{ fontSize: '40px', marginBottom: '12px' }}>${cfg.icon}</div>
            <div style=${{ fontSize: '16px', fontWeight: 600, color: COLORS.text }}>${cfg.title}</div>
          </div>
          <input type="number" value=${cfg.value} onChange=${e => cfg.setValue(e.target.value)}
            min=${cfg.min} step="0.1"
            style=${{ ...S.input, fontSize: '24px', textAlign: 'center', marginBottom: '8px' }} />
          <div style=${{ textAlign: 'center', color: COLORS.textMuted, fontFamily: FONTS.mono, fontSize: '12px', marginBottom: '20px' }}>${cfg.unit}</div>
          <button onClick=${cfg.next} disabled=${!cfg.valid}
            style=${{ ...S.btn(cfg.valid ? COLORS.gold : '#333', cfg.valid ? '#111' : '#666'), width: '100%' }}>
            Weiter →
          </button>
        </div>
        <div style=${{ marginTop: '20px', fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono }}>Schritt ${step} von 4</div>
      </div>
    `;
  }

  // Schritt 4: Körperfett (optional)
  return html`
    <div style=${{ minHeight: '100vh', background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style=${{ textAlign: 'center', marginBottom: '40px' }}>
        <div style=${{ fontSize: '32px', marginBottom: '8px' }}>🥗</div>
        <div style=${{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: 700, color: COLORS.text }}>Ernährungs-Tool</div>
      </div>
      ${dots}
      <div style=${{ ...S.card, width: '100%', maxWidth: '360px' }}>
        <div style=${{ textAlign: 'center', marginBottom: '24px' }}>
          <div style=${{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <div style=${{ fontSize: '16px', fontWeight: 600, color: COLORS.text }}>Kennst du deinen Körperfettanteil?</div>
          <div style=${{ fontSize: '11px', color: COLORS.textSubtle, marginTop: '6px' }}>Optional — gemessen z.B. mit BIA-Waage</div>
        </div>
        <input type="number" value=${bodyFat} onChange=${e => setBodyFat(e.target.value)}
          placeholder="z.B. 35" min="5" max="70" step="0.1"
          style=${{ ...S.input, fontSize: '24px', textAlign: 'center', marginBottom: '8px' }} />
        <div style=${{ textAlign: 'center', color: COLORS.textMuted, fontFamily: FONTS.mono, fontSize: '12px', marginBottom: '20px' }}>% Körperfett</div>
        <button onClick=${() => handleFinish(false)} disabled=${!bodyFat || parseFloat(bodyFat) < 5}
          style=${{ ...S.btn(parseFloat(bodyFat) >= 5 ? COLORS.gold : '#333', parseFloat(bodyFat) >= 5 ? '#111' : '#666'), width: '100%', marginBottom: '12px' }}>
          ✓ Fertig starten
        </button>
        <button onClick=${() => handleFinish(true)}
          style=${{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', width: '100%', fontSize: '12px', fontFamily: FONTS.mono, textDecoration: 'underline' }}>
          Überspringen (Schätzwert 40% wird verwendet)
        </button>
      </div>
      <div style=${{ marginTop: '20px', fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono }}>Schritt 4 von 4</div>
    </div>
  `;
}
