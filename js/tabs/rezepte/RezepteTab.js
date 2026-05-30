import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

const INITIAL_RECIPES = [
  { name:"Griechischer Joghurt Bowl", meal:"Frühstück / Post-Workout", time:"5 min", kcal:420, protein:48, carbs:32, fat:9, icon:"🥛", tip:"Quark + Joghurt = langsames Casein für lang anhaltende Aminosäureversorgung." },
  { name:"Hüttenkäse-Lachs-Wrap", meal:"Mittagessen", time:"10 min", kcal:480, protein:52, carbs:28, fat:14, icon:"🐟", tip:"Lachs liefert Omega-3 — wichtig für Entzündungsregulation bei intensivem Training." },
  { name:"Hähnchen-Bowl mit Linsen", meal:"Mittag / Abendessen", time:"20 min", kcal:520, protein:58, carbs:35, fat:12, icon:"🍗", tip:"Linsen liefern zusätzliches pflanzliches Protein + Ballaststoffe für Sättigung." },
  { name:"Eiweiß-Omelette", meal:"Frühstück / Abendessen", time:"10 min", kcal:380, protein:42, carbs:8, fat:18, icon:"🥚", tip:"Abends ideal: kaum KH, viel Protein. Hüttenkäse = Casein für nächtliche Regeneration." },
  { name:"Skyr-Pfannkuchen", meal:"Pre-Workout / Frühstück", time:"15 min", kcal:440, protein:38, carbs:48, fat:8, icon:"🥞", tip:"KH + Protein für Pre-Workout. Haferflocken = langsamer Glukoseanstieg." },
  { name:"Thunfisch-Avocado-Bowl", meal:"Mittagessen", time:"5 min", kcal:460, protein:44, carbs:18, fat:22, icon:"🥑", tip:"Schnell zubereitet, kein Kochen nötig. Avocado liefert Fett ohne KH-Spike." },
  { name:"Abend-Casein-Quark", meal:"Abendessen / Snack", time:"2 min", kcal:280, protein:38, carbs:14, fat:5, icon:"🌙", tip:"Kasein wird langsam verdaut — ideal direkt vor dem Schlafen." },
  { name:"Rindfleisch-Gemüse-Pfanne", meal:"Abendessen", time:"20 min", kcal:490, protein:50, carbs:15, fat:22, icon:"🥩", tip:"Rotes Fleisch liefert Kreatin, Eisen und Zink — wichtig für Krafttraining." },
];

export function RezepteTab() {
  const [expanded, setExpanded] = useState(null);
  return html`
    <div style=${S.content}>
      <div style=${S.cardTitle}>Rezepte (Phase 4: Zubereitungsschritte folgen)</div>
      ${INITIAL_RECIPES.map((r, i) => html`
        <div key=${i} style=${{ ...S.card, cursor: 'pointer' }} onClick=${() => setExpanded(expanded === i ? null : i)}>
          <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style=${{ fontSize: '22px' }}>${r.icon}</span>
              <div>
                <div style=${{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>${r.name}</div>
                <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${r.meal} · ${r.time}</div>
              </div>
            </div>
            <div style=${{ textAlign: 'right' }}>
              <div style=${{ fontSize: '13px', fontWeight: 700, color: COLORS.gold }}>${r.protein}g P</div>
              <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${r.kcal} kcal</div>
            </div>
          </div>
          ${expanded === i && html`
            <div style=${{ marginTop: '10px', borderTop: '1px solid #1e1e1e', paddingTop: '10px' }}>
              <p style=${{ fontSize: '12px', color: COLORS.textMuted, lineHeight: 1.6 }}>${r.tip}</p>
            </div>
          `}
        </div>
      `)}
    </div>
  `;
}
