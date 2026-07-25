/**
 * LM Nutrition — Foods
 * Listado y gestión de la base de datos de alimentos.
 */

import { foodService }  from '../services/FoodService.js';
import { modal }        from '../components/Modal.js';
import { toast }        from '../components/Toast.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';

const CATS = [
  { key: 'all',           label: 'Todos'       },
  { key: 'proteinas',     label: 'Proteínas'   },
  { key: 'carbohidratos', label: 'Carbos'      },
  { key: 'grasas',        label: 'Grasas'      },
  { key: 'verduras',      label: 'Verduras'    },
  { key: 'frutas',        label: 'Frutas'      },
  { key: 'lacteos',       label: 'Lácteos'     },
  { key: 'general',       label: 'Otros'       }
];

export const FoodsModule = {
  _cat: 'all',
  _q:   '',
  _debounce: null,
  _unsubs: [],

  async render(container) {
    this._el = container;
    container.innerHTML = this._shell();
    this._bindEvents(container);
    this._unsubs.push(eventBus.on(EVENTS.FOOD_CREATED, () => this._loadList()));
    await this._loadList();
  },

  destroy() {
    this._unsubs.forEach(f => f());
    this._unsubs = [];
  },

  _shell() {
    return `
      <header class="page-header">
        <div class="page-header__title">Alimentos</div>
        <button class="btn btn--sm btn--primary" id="foods-new">+ Nuevo</button>
      </header>

      <div style="padding:0 var(--space-4)">
        <input class="input" id="foods-search" type="search"
          placeholder="Buscar alimento..." autocomplete="off"
          style="margin-bottom:var(--space-3)">

        <div style="display:flex;gap:var(--space-2);overflow-x:auto;padding-bottom:var(--space-3);
          scrollbar-width:none;-webkit-overflow-scrolling:touch">
          ${CATS.map(c => `
            <button class="choice-btn ${c.key === this._cat ? 'selected' : ''}"
              data-cat="${c.key}" style="flex:none;min-width:auto;white-space:nowrap;padding:var(--space-2) var(--space-3)">
              ${c.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div id="foods-list" style="padding:0 var(--space-4) var(--space-8);display:flex;flex-direction:column;gap:var(--space-2)">
        <div class="spinner" style="margin:var(--space-10) auto"></div>
      </div>
    `;
  },

  _bindEvents(container) {
    container.querySelector('#foods-search')?.addEventListener('input', e => {
      clearTimeout(this._debounce);
      this._q = e.target.value;
      this._debounce = setTimeout(() => this._loadList(), 280);
    });

    container.addEventListener('click', e => {
      const catBtn = e.target.closest('[data-cat]');
      if (catBtn) {
        this._cat = catBtn.dataset.cat;
        container.querySelectorAll('[data-cat]').forEach(b =>
          b.classList.toggle('selected', b.dataset.cat === this._cat)
        );
        this._loadList();
      }

      if (e.target.id === 'foods-new' || e.target.closest('#foods-new')) {
        this._openCreateModal();
      }
    });
  },

  async _loadList() {
    const list = this._el?.querySelector('#foods-list');
    if (!list) return;

    let foods = this._cat === 'all'
      ? await foodService.getAll()
      : await foodService.getAll(this._cat);

    if (this._q.trim().length >= 2) {
      const q = this._q.toLowerCase();
      foods = foods.filter(f => f.name.toLowerCase().includes(q));
    }

    if (!foods.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🥗</div>
          <div class="empty-state__title">Sin resultados</div>
          <div class="empty-state__text">Probá otro filtro o creá un alimento nuevo.</div>
        </div>
      `;
      return;
    }

    list.innerHTML = `<div class="stagger">${foods.map(f => `
      <div class="food-item" data-food-id="${f.id}">
        <div class="food-item__info">
          <div class="food-item__name">${f.name}</div>
          <div class="food-item__meta">
            P:${f.per100g.proteinG}g · C:${f.per100g.carbsG}g · G:${f.per100g.fatG}g
            ${f.isCustom ? '<span style="color:var(--color-accent);margin-left:4px">✦ propio</span>' : ''}
          </div>
        </div>
        <div class="food-item__kcal">${f.per100g.calories}</div>
      </div>
    `).join('')}</div>`;
  },

  _openCreateModal() {
    modal.open({
      title: 'Nuevo alimento',
      content: `
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="input-group">
            <label class="input-label">Nombre *</label>
            <input class="input" id="nf-name" type="text" placeholder="Ej: Pechuga de pollo">
          </div>
          <div class="input-group">
            <label class="input-label">Categoría</label>
            <select class="input" id="nf-cat">
              ${CATS.filter(c => c.key !== 'all').map(c => `<option value="${c.key}">${c.label}</option>`).join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
            <div class="input-group">
              <label class="input-label">Calorías *</label>
              <input class="input" id="nf-cal" type="number" min="0" placeholder="kcal/100g">
            </div>
            <div class="input-group">
              <label class="input-label">Proteína (g)</label>
              <input class="input" id="nf-prot" type="number" min="0" step="0.1" placeholder="0">
            </div>
            <div class="input-group">
              <label class="input-label">Carbohidratos (g)</label>
              <input class="input" id="nf-carb" type="number" min="0" step="0.1" placeholder="0">
            </div>
            <div class="input-group">
              <label class="input-label">Grasas (g)</label>
              <input class="input" id="nf-fat" type="number" min="0" step="0.1" placeholder="0">
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" style="flex:1" id="nf-cancel">Cancelar</button>
            <button class="btn btn--primary" style="flex:2" id="nf-save">Guardar</button>
          </div>
        </div>
      `
    });

    document.getElementById('nf-cancel')?.addEventListener('click', () => modal.close());
    document.getElementById('nf-save')?.addEventListener('click', async () => {
      const name = document.getElementById('nf-name')?.value?.trim();
      const cal  = parseFloat(document.getElementById('nf-cal')?.value) || 0;
      if (!name) { toast.show('El nombre es requerido', 'warning'); return; }
      try {
        await foodService.create({
          name,
          category: document.getElementById('nf-cat')?.value || 'general',
          per100g: {
            calories: cal,
            proteinG: parseFloat(document.getElementById('nf-prot')?.value) || 0,
            carbsG:   parseFloat(document.getElementById('nf-carb')?.value) || 0,
            fatG:     parseFloat(document.getElementById('nf-fat')?.value)  || 0
          }
        });
        modal.close();
        toast.show(`${name} creado`, 'success');
        this._loadList();
      } catch (e) {
        console.error(e);
        toast.show('Error al guardar', 'error');
      }
    });
  }
};
