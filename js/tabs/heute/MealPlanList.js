import { html } from '../../lib.js';
import { MealPlanEntry } from './MealPlanEntry.js';
import { getMealTemplate } from '../../data/mealTemplates.js';
import { distributeMacrosPerMeal } from '../../calc/macros.js';

export function MealPlanList({ dayType, trainingTime, macros }) {
  const template = getMealTemplate(dayType, trainingTime);
  const meals = distributeMacrosPerMeal(template, macros);

  return html`
    <div>
      ${meals.map((meal, i) => html`<${MealPlanEntry} key=${i} meal=${meal} />`)}
    </div>
  `;
}
