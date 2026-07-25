/**
 * LM Nutrition — Log
 * Registro de alimentos. Búsqueda y log a comida seleccionada.
 */

import { foodService }      from '../services/FoodService.js';
import { nutritionService } from '../services/NutritionService.js';
import { modal }            from '../components/Modal.js';
import { toast }            from '../components/Toast.js';
import { router }           from '../utils/router.js';
import { todayStr }         from '../utils/dateUtils.js';

const MEAL_LABELS = {
  breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Colación', other: 'Otro'
};

export const LogModule = {
  _debounce: null,
  _targetMealId: null,
  _date: null,

  async render(container) {
    this._targetMealId = sessionStorage.getItem('lm-add-to-meal') || null;
    this._date         = sessionStorage.getItem('lm-add-to-date') || todayStr();
    sessionStorage.removeItem('lm-add-to-meal');
    sessionStorage.removeItem('lm-add-to-date');

    const meals = await nutritionService.getMealsForDate(this._date);

    container.innerHTML = `
      <header class="page-header">
        <button class="btn btn--icon" id="log-back" aria-label="Volver">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="page-header__title">Registrar alimento</div>
        <div style="width:40px"></div>
      </header>

      <div style="padding:var(--space-4)">
        <!-- Selector de comida -->
        <div class="input-group" style="margin-bottom:var(--space-4)">
          <label class="input-label">Agregar a</label>
          <select class="input" id="log-meal-select">
            ${meals.map(m => `
              <option value="${m.id}" ${String(m.id) === String(this._targetMealId) ? 'selected' : ''}>
                ${MEAL_LABELS[m.type] ?? m.type}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Búsqueda -->
        <div class="input-group" style="margin-bottom:var(--space-4)">
          <label class="input-label">Buscar alimento</label>
          <input class="input" id="log-search" type="search"
            placeholder="Escribí el nombre..." autocomplete="off" autofocus>
        </div>

        <div id="log-results" style="display:flex;flex-direction:column;gap:var(--space-2)">
          <div class="empty-state" style="padding:var(--space-10) var(--space-4)">
            <div class="empty-state__icon">🔍</div>
            <div class="empty-state__title">Buscá un alimento</div>
            <div class="empty-state__text">Escribí al menos 2 letras para ver resultados.</div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#log-back')?.addEventListener('click', () => router.navigate('dashboard'));
    container.querySelector('#log-search')?.addEventListener('input', e => {
      clearTimeout(this._debounce);
      this._debounce = setTimeout(() => this._search(container, e.target.value), 280);
    });
  },

  destroy() { clearTimeout(this._debounce); },

  async _search(container, q) {
    const results  = await foodService.search(q);
    const resultsEl = container.querySelector('#log-results');

    if (!results.length) {
      resultsEl.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8) var(--space-4)">
          <div class="empty-state__icon">🍽️</div>
          <div class="empty-state__title">Sin resultados</div>
          <div class="empty-state__text">No encontramos "${q}". Podés crearlo en Alimentos.</div>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = `<div class="stagger">${results.map(f => `
      <div class="food-item" data-food-id="${f.id}">
        <div class="food-item__info">
          <div class="food-item__name">${f.name}</div>
          <div class="food-item__meta">
            P: ${f.per100g.proteinG}g · C: ${f.per100g.carbsG}g · G: ${f.per100g.fatG}g
          </div>
        </div>
        <div class="food-item__kcal">${f.per100g.calories}</div>
      </div>
    `).join('')}</div>`;

    resultsEl.addEventListener('click', e => {
      const item = e.target.closest('[data-food-id]');
      if (!item) return;
      const food = results.find(f => f.id == item.dataset.foodId);
      if (food) this._showQuantityModal(container, food);
    }, { once: true });
  },

  _showQuantityModal(container, food) {
    modal.open({
      title: food.name,
      content: `
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4)">
          ${food.per100g.calories} kcal · P:${food.per100g.proteinG}g · C:${food.per100g.carbsG}g · G:${food.per100g.fatG}g <span style="opacity:0.6">(por 100g)</span>
        </p>
        <div class="input-group" style="margin-bottom:var(--space-4)">
          <label class="input-label">Cantidad (gramos)</label>
          <input class="input" id="modal-qty" type="number" min="1" max="2000" value="100" step="10">
        </div>
        <div id="modal-preview" style="padding:var(--space-3);background:var(--color-bg-elevated);border-radius:var(--radius-md);
          font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-4)">
          100g → <strong style="color:var(--color-text-primary)">${food.per100g.calories} kcal</strong>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" style="flex:1" id="modal-cancel">Cancelar</button>
          <button class="btn btn--primary" style="flex:2" id="modal-confirm">Agregar</button>
        </div>
      `,
      onClose: () => {}
    });

    const qtyInput = document.getElementById('modal-qty');
    const preview  = document.getElementById('modal-preview');

    qtyInput?.addEventListener('input', () => {
      const q   = parseFloat(qtyInput.value) || 0;
      const cal = Math.round(food.per100g.calories * q / 100);
      const p   = Math.round(food.per100g.proteinG * q / 100 * 10) / 10;
      const c   = Math.round(food.per100g.carbsG   * q / 100 * 10) / 10;
      const fat = Math.round(food.per100g.fatG     * q / 100 * 10) / 10;
      preview.innerHTML = `${q}g → <strong style="color:var(--color-text-primary)">${cal} kcal</strong>
        <span style="margin-left:var(--space-2)">P:${p}g C:${c}g G:${fat}g</span>`;
    });

    document.getElementById('modal-cancel')?.addEventListener('click', () => modal.close());

    document.getElementById('modal-confirm')?.addEventListener('click', async () => {
      const qty    = parseFloat(qtyInput?.value) || 100;
      const mealId = parseInt(container.querySelector('#log-meal-select')?.value);
      if (!mealId) { toast.show('Seleccioná una comida', 'warning'); return; }

      try {
        await nutritionService.addItemToMeal(mealId, food.id, qty, this._date);
        modal.close();
        toast.show(`${food.name} agregado`, 'success');
        router.navigate('dashboard');
      } catch (e) {
        console.error(e);
        toast.show('Error al guardar', 'error');
      }
    });
  }
};
