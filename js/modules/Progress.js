/**
 * LM Nutrition — Progress
 * Seguimiento de peso y gráfico de historial de calorías.
 */

import { db }           from '../storage/db.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import { toast }        from '../components/Toast.js';
import { lastNDays, formatDisplayDate } from '../utils/dateUtils.js';
import { nutritionService } from '../services/NutritionService.js';
import { profileService }   from '../services/ProfileService.js';

export const ProgressModule = {
  _unsubs: [],

  async render(container) {
    container.innerHTML = `
      <header class="page-header">
        <div class="page-header__title">Progreso</div>
      </header>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">
        <div id="prog-weight-card"></div>
        <div id="prog-chart-card"></div>
        <div id="prog-stats-card"></div>
      </div>
    `;

    await this._renderAll(container);

    this._unsubs.push(
      eventBus.on(EVENTS.WEIGHT_LOGGED, () => this._renderAll(container)),
      eventBus.on(EVENTS.NUTRITION_UPDATED, () => this._renderChart(container))
    );
  },

  destroy() {
    this._unsubs.forEach(f => f());
    this._unsubs = [];
  },

  async _renderAll(container) {
    await Promise.all([
      this._renderWeight(container),
      this._renderChart(container),
      this._renderStats(container)
    ]);
  },

  async _renderWeight(container) {
    const el      = container.querySelector('#prog-weight-card');
    if (!el) return;
    const entries = await db.getAll('weight');
    const sorted  = entries.sort((a, b) => b.date.localeCompare(a.date));
    const latest  = sorted[0];
    const prev    = sorted[1];
    const diff    = latest && prev ? (latest.weightKg - prev.weightKg).toFixed(1) : null;

    el.innerHTML = `
      <div class="card card--accent">
        <div class="card__label">Peso actual</div>
        <div style="display:flex;align-items:flex-end;gap:var(--space-3);margin-bottom:var(--space-4)">
          <div class="card__value">${latest ? latest.weightKg : '—'}<span class="card__unit">kg</span></div>
          ${diff !== null ? `<div style="font-size:var(--text-sm);padding-bottom:4px;color:${parseFloat(diff) < 0 ? 'var(--color-success)' : 'var(--color-error)'}">
            ${parseFloat(diff) >= 0 ? '+' : ''}${diff} kg
          </div>` : ''}
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <input class="input" id="w-input" type="number" step="0.1" min="30" max="300"
            placeholder="Ej: 72.5" style="flex:1">
          <button class="btn btn--primary" id="w-save">Registrar</button>
        </div>
        ${sorted.length ? `
          <div style="margin-top:var(--space-4);display:flex;flex-direction:column;gap:var(--space-2)">
            ${sorted.slice(0, 5).map(e => `
              <div style="display:flex;justify-content:space-between;font-size:var(--text-sm)">
                <span style="color:var(--color-text-secondary)">${formatDisplayDate(e.date)}</span>
                <span>${e.weightKg} kg</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    el.querySelector('#w-save')?.addEventListener('click', async () => {
      const v = parseFloat(el.querySelector('#w-input')?.value);
      if (!v || v < 30 || v > 300) { toast.show('Ingresá un peso válido', 'warning'); return; }
      const today = new Date().toISOString().slice(0, 10);
      await db.put('weight', { date: today, weightKg: v });
      toast.show(`Peso ${v} kg registrado`, 'success');
      eventBus.emit(EVENTS.WEIGHT_LOGGED, { date: today, weightKg: v });
    });
  },

  async _renderChart(container) {
    const el      = container.querySelector('#prog-chart-card');
    if (!el) return;
    const targets = await profileService.getTargets();
    const days    = lastNDays(7);

    const summaries = await Promise.all(days.map(d => nutritionService.getDailySummary(d)));

    const max      = Math.max(targets.calories * 1.2, ...summaries.map(s => s.consumed.calories), 100);
    const barH     = 80;

    el.innerHTML = `
      <div class="card">
        <div class="card__label" style="margin-bottom:var(--space-4)">Calorías — últimos 7 días</div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:${barH + 28}px">
          ${summaries.map((s, i) => {
            const h   = Math.round((s.consumed.calories / max) * barH);
            const over = s.consumed.calories > targets.calories;
            const day  = days[i].slice(8);
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                <div style="font-size:9px;color:var(--color-text-tertiary)">${Math.round(s.consumed.calories) || ''}</div>
                <div style="height:${Math.max(h, 2)}px;width:100%;border-radius:4px 4px 0 0;
                  background:${over ? 'var(--color-error)' : 'var(--color-accent)'};opacity:${s.hasData ? 1 : 0.2}">
                </div>
                <div style="font-size:10px;color:var(--color-text-secondary)">${day}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:var(--space-3);display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:var(--color-text-secondary)">
          <div style="width:10px;height:10px;border-radius:2px;background:var(--color-accent)"></div>
          Objetivo: ${targets.calories} kcal
          <div style="width:10px;height:10px;border-radius:2px;background:var(--color-error);margin-left:var(--space-2)"></div>
          Exceso
        </div>
      </div>
    `;
  },

  async _renderStats(container) {
    const el      = container.querySelector('#prog-stats-card');
    if (!el) return;
    const days    = lastNDays(7);
    const sums    = await Promise.all(days.map(d => nutritionService.getDailySummary(d)));
    const active  = sums.filter(s => s.hasData);
    if (!active.length) {
      el.innerHTML = `<div class="card"><div style="color:var(--color-text-secondary);font-size:var(--text-sm);text-align:center">Registrá alimentos para ver estadísticas.</div></div>`;
      return;
    }
    const avg = (key) => Math.round(active.reduce((s, d) => s + (d.consumed[key] ?? 0), 0) / active.length);
    el.innerHTML = `
      <div class="card">
        <div class="card__label" style="margin-bottom:var(--space-4)">Promedio últimos 7 días</div>
        <div class="stat-grid">
          ${[
            { label: 'Calorías', val: avg('calories'), unit: 'kcal', color: 'var(--color-accent)' },
            { label: 'Proteína', val: avg('proteinG'), unit: 'g',    color: 'var(--color-protein)' },
            { label: 'Carbos',   val: avg('carbsG'),   unit: 'g',    color: 'var(--color-carbs)' },
            { label: 'Grasas',   val: avg('fatG'),     unit: 'g',    color: 'var(--color-fat)' }
          ].map(s => `
            <div style="padding:var(--space-3);background:var(--color-bg-elevated);border-radius:var(--radius-md)">
              <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:4px">${s.label}</div>
              <div style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;color:${s.color}">${s.val}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">${s.unit}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
