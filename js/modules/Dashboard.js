/**
 * LM Nutrition — Dashboard
 * Vista principal. Muestra resumen diario con anillos de macros,
 * agua y tarjetas de comidas expandibles.
 */

import { nutritionService } from '../services/NutritionService.js';
import { profileService }   from '../services/ProfileService.js';
import { MacroRing }        from '../components/MacroRing.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import { router }           from '../utils/router.js';
import { todayStr, formatDisplayDate, toDateStr, addDays } from '../utils/dateUtils.js';
import { pct }              from '../utils/macroCalc.js';

const MEAL_META = {
  breakfast: { label: 'Desayuno', icon: '☀️' },
  lunch:     { label: 'Almuerzo', icon: '🍽️' },
  dinner:    { label: 'Cena',     icon: '🌙' },
  snack:     { label: 'Colación', icon: '🍎' },
  other:     { label: 'Otro',     icon: '📦' }
};

export const DashboardModule = {
  _date:    null,
  _ring:    null,
  _unsubs:  [],
  _el:      null,

  async render(container) {
    this._el   = container;
    this._date = todayStr();
    container.innerHTML = this._skelHtml();
    this._unsubs.push(
      eventBus.on(EVENTS.NUTRITION_UPDATED, ({ date }) => {
        if (date === this._date) this._load();
      })
    );
    await this._load();
  },

  destroy() {
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
    this._ring   = null;
  },

  async _load() {
    const [summary, targets] = await Promise.all([
      nutritionService.getDailySummary(this._date),
      profileService.getTargets()
    ]);
    const { meals, grouped } = await nutritionService.getItemsByMeal(this._date);
    this._draw(summary, targets, meals, grouped);
  },

  _draw(summary, targets, meals, grouped) {
    const c = this._el;
    c.innerHTML = `
      <header class="page-header">
        <button class="btn btn--icon" id="d-prev" aria-label="Día anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style="text-align:center;line-height:1.2">
          <div style="font-size:var(--text-lg);font-weight:var(--weight-semibold)">${formatDisplayDate(this._date)}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">${this._date}</div>
        </div>
        <button class="btn btn--icon" id="d-next" aria-label="Día siguiente" ${this._date >= todayStr() ? 'disabled style="opacity:0.3;pointer-events:none"' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </header>

      <div id="ring-mount"></div>

      <div style="padding:0 var(--space-4) var(--space-2)">
        ${this._waterHtml(targets)}
      </div>

      <div class="section-header">
        <span class="section-header__title">Comidas</span>
      </div>

      <div id="meals-wrap" class="stagger" style="padding:0 var(--space-4) var(--space-6);display:flex;flex-direction:column;gap:var(--space-3)">
        ${meals.map(m => this._mealCardHtml(m, grouped[m.id]?.items ?? [])).join('')}
      </div>
    `;

    // Mount ring
    this._ring = new MacroRing(c.querySelector('#ring-mount'));
    this._ring.update({ consumed: summary.consumed, target: targets });

    // Events
    c.querySelector('#d-prev')?.addEventListener('click', () => this._shift(-1));
    c.querySelector('#d-next')?.addEventListener('click', () => this._shift(1));

    // Meal card toggles
    c.querySelectorAll('[data-meal-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const body = c.querySelector(`#meal-body-${btn.dataset.mealToggle}`);
        if (body) body.classList.toggle('open');
      });
    });

    // Add food buttons
    c.querySelectorAll('[data-add-to-meal]').forEach(btn => {
      btn.addEventListener('click', () => {
        sessionStorage.setItem('lm-add-to-meal', btn.dataset.addToMeal);
        sessionStorage.setItem('lm-add-to-date', this._date);
        router.navigate('log');
      });
    });
  },

  _mealCardHtml(meal, items) {
    const meta = MEAL_META[meal.type] ?? MEAL_META.other;
    const kcal = items.reduce((s, i) => s + (i.macros?.calories ?? 0), 0);
    return `
      <div class="meal-card">
        <div class="meal-card__header" data-meal-toggle="${meal.id}">
          <span class="meal-card__icon">${meta.icon}</span>
          <div class="meal-card__info">
            <div class="meal-card__title">${meta.label}</div>
            <div class="meal-card__count">${items.length} alimento${items.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="meal-card__kcal">${Math.round(kcal)}<span style="font-size:var(--text-xs);font-weight:400;color:var(--color-text-secondary)"> kcal</span></div>
        </div>
        <div class="meal-card__body" id="meal-body-${meal.id}">
          ${items.length ? items.map(i => `
            <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border-subtle);font-size:var(--text-sm)">
              <span style="color:var(--color-text-primary)">${i.food.name}</span>
              <span style="color:var(--color-text-secondary)">${i.quantityG}g · ${Math.round(i.macros.calories)} kcal</span>
            </div>
          `).join('') : ''}
          <button class="meal-card__add" data-add-to-meal="${meal.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Agregar alimento
          </button>
        </div>
      </div>
    `;
  },

  _waterHtml(targets) {
    const waterMl = targets.waterMl ?? 2000;
    const waterP  = pct(0, waterMl);
    return `
      <div class="progress-bar">
        <div class="progress-bar__head">
          <span class="progress-bar__label">💧 Agua</span>
          <span class="progress-bar__values"><strong>0</strong> / ${waterMl} ml</span>
        </div>
        <div class="progress-bar__track">
          <div class="progress-bar__fill" style="width:${waterP}%;background:var(--color-water)"></div>
        </div>
      </div>
    `;
  },

  _shift(delta) {
    const next = toDateStr(addDays(new Date(this._date + 'T12:00:00'), delta));
    if (next > todayStr()) return;
    this._date = next;
    this._load();
  },

  _skelHtml() {
    return `
      <header class="page-header">
        <div class="skeleton" style="width:40px;height:40px;border-radius:var(--radius-md)"></div>
        <div><div class="skeleton" style="width:80px;height:18px;margin:0 auto 6px"></div></div>
        <div class="skeleton" style="width:40px;height:40px;border-radius:var(--radius-md)"></div>
      </header>
      <div style="display:flex;justify-content:center;padding:var(--space-10)">
        <div class="skeleton" style="width:216px;height:216px;border-radius:50%"></div>
      </div>
    `;
  }
};
