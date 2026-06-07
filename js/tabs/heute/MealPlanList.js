import { html } from '../../lib.js';
import { MealPlanEntry } from './MealPlanEntry.js';
import { getMealTemplate } from '../../data/mealTemplates.js';
import { distributeMacrosPerMeal } from '../../calc/macros.js';

export function MealPlanList({ dayType, trainingTime, macros, consumedBySlot, wakeUpTime, trainingDurationMin }) {
  const template = getMealTemplate(dayType, trainingTime, wakeUpTime, trainingDurationMin);
  const meals = distributeMacrosPerMeal(template, macros);

  return html`
    <div>
      ${meals.map((meal, i) => {
        const consumedMacros = consumedBySlot
          ? (consumedBySlot[meal.label] ?? { p: 0, c: 0, f: 0 })
          : undefined;
        return html`<${MealPlanEntry} key=${i} meal=${meal} consumedMacros=${consumedMacros} />`;
      })}
    </div>
  `;
}
