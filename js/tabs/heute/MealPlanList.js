import { html } from '../../lib.js';
import { MealPlanEntry } from './MealPlanEntry.js';
import { getMealTemplate } from '../../data/mealTemplates.js';
import { distributeMacrosPerMeal } from '../../calc/macros.js';

export function MealPlanList({ dayType, trainingTime, macros, consumedBySlot }) {
  const template = getMealTemplate(dayType, trainingTime);
  const meals = distributeMacrosPerMeal(template, macros);

  return html`
    <div>
      ${meals.map((meal, i) => {
        const consumedProtein = consumedBySlot
          ? (consumedBySlot[meal.label] ?? 0)
          : undefined;
        return html`<${MealPlanEntry} key=${i} meal=${meal} consumedProtein=${consumedProtein} />`;
      })}
    </div>
  `;
}
