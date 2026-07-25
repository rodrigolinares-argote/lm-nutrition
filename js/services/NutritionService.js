/**
 * LM Nutrition — NutritionService
 * Toda la lógica de comidas, ítems y resúmenes diarios.
 */

import { db }                       from '../storage/db.js';
import { defaults }                 from '../storage/schema.js';
import { eventBus, EVENTS }        from '../utils/eventBus.js';
import { scaleMacros, sumMacros }  from '../utils/macroCalc.js';
import { todayStr }                from '../utils/dateUtils.js';

class NutritionService {
  async getMealsForDate(date = todayStr()) {
    const existing = await db.getByIndex('meals', 'by-date', date);
    if (existing.length > 0) return existing;

    const types = ['breakfast', 'lunch', 'dinner', 'snack'];
    const meals = [];
    for (const type of types) {
      const rec = defaults.meal({ date, type });
      const id  = await db.add('meals', rec);
      meals.push({ ...rec, id });
    }
    return meals;
  }

  async addItemToMeal(mealId, foodId, quantityG, date = todayStr()) {
    const item = defaults.mealItem({ mealId, foodId, quantityG, date });
    const id   = await db.add('mealItems', item);
    await db.sync('mealItems', id);
    eventBus.emit(EVENTS.MEAL_ITEM_ADDED, { id, mealId, foodId, date });
    eventBus.emit(EVENTS.NUTRITION_UPDATED, { date });
    return id;
  }

  async updateItemQuantity(itemId, quantityG) {
    const item = await db.get('mealItems', itemId);
    if (!item) throw new Error(`Item ${itemId} no encontrado`);
    const updated = { ...item, quantityG };
    await db.put('mealItems', updated);
    eventBus.emit(EVENTS.NUTRITION_UPDATED, { date: item.date });
    return updated;
  }

  async deleteItem(itemId) {
    const item = await db.get('mealItems', itemId);
    if (!item) return;
    await db.delete('mealItems', itemId);
    eventBus.emit(EVENTS.MEAL_ITEM_DELETED, { id: itemId, date: item.date });
    eventBus.emit(EVENTS.NUTRITION_UPDATED, { date: item.date });
  }

  async getItemsForDate(date = todayStr()) {
    const items    = await db.getByIndex('mealItems', 'by-date', date);
    const enriched = await Promise.all(items.map(async item => {
      const food = await db.get('foods', item.foodId);
      if (!food) return null;
      return { ...item, food, macros: scaleMacros(food.per100g, item.quantityG) };
    }));
    return enriched.filter(Boolean);
  }

  async getDailySummary(date = todayStr()) {
    const [items, meals] = await Promise.all([
      this.getItemsForDate(date),
      this.getMealsForDate(date)
    ]);
    const consumed = sumMacros(items.map(i => i.macros));
    return { date, consumed, meals, items, hasData: items.length > 0 };
  }

  async getItemsByMeal(date = todayStr()) {
    const [meals, items] = await Promise.all([
      this.getMealsForDate(date),
      this.getItemsForDate(date)
    ]);
    const grouped = {};
    for (const meal of meals) {
      grouped[meal.id] = {
        meal,
        items: items.filter(i => i.mealId === meal.id)
      };
    }
    return { meals, grouped };
  }
}

export const nutritionService = new NutritionService();
