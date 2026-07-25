/**
 * LM Nutrition — Profile
 * Perfil del usuario, onboarding inicial y cálculo de objetivos.
 */

import { profileService }             from '../services/ProfileService.js';
import { toast }                      from '../components/Toast.js';
import { calcBMR, calcTDEE,
         calcCalorieTarget,
         calcMacroTargets, calcAge,
         calcBMI, bmiCategory }       from '../utils/macroCalc.js';

const ACTIVITY = [
  { v: 'sedentary',   l: 'Sedentario',  d: 'Sin ejercicio' },
  { v: 'light',       l: 'Ligero',      d: '1–3 días/sem' },
  { v: 'moderate',    l: 'Moderado',    d: '3–5 días/sem' },
  { v: 'active',      l: 'Activo',      d: '6–7 días/sem' },
  { v: 'very_active', l: 'Muy activo',  d: 'Doble sesión' }
];
const GOALS = [
  { v: 'lose',     l: 'Perder',    i: '↓' },
  { v: 'maintain', l: 'Mantener',  i: '→' },
  { v: 'gain',     l: 'Ganar',     i: '↑' }
];

export const ProfileModule = {
  _profile: null,
  _el: null,

  async render(container) {
    this._el      = container;
    this._profile = await profileService.get();
    const done    = await profileService.isComplete();
    container.innerHTML = done ? this._profileView() : this._onboardingView();
    this._bind(container);
  },

  destroy() {},

  _profileView() {
    const p  = this._profile;
    const age = calcAge(p.birthDate);
    const bmr = calcBMR(p.sex, p.weightKg, p.heightCm, age);
    const tde = calcTDEE(bmr, p.activityLevel);
    const cal = calcCalorieTarget(tde, p.goal);
    const mac = calcMacroTargets(cal, p.weightKg, p.goal);
    const bmi = calcBMI(p.weightKg, p.heightCm);
    const ini = p.name?.charAt(0)?.toUpperCase() ?? '?';

    const GOAL_LABEL = { lose: 'Perder peso', maintain: 'Mantener peso', gain: 'Ganar músculo' };
    const ACT_LABEL  = Object.fromEntries(ACTIVITY.map(a => [a.v, a.l]));

    return `
      <header class="page-header">
        <div class="page-header__title">Mi Perfil</div>
        <button class="btn btn--sm btn--ghost" id="p-edit-btn">Editar</button>
      </header>

      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">
        <!-- Identity -->
        <div class="card card--accent" style="display:flex;align-items:center;gap:var(--space-4)">
          <div class="avatar">${ini}</div>
          <div>
            <div style="font-size:var(--text-xl);font-weight:var(--weight-semibold)">${p.name}</div>
            <div style="font-size:var(--text-sm);color:var(--color-text-secondary)">
              ${age} años · ${p.heightCm} cm · ${p.weightKg} kg
            </div>
            <div style="font-size:var(--text-sm);margin-top:2px">
              IMC <strong style="color:var(--color-accent)">${bmi}</strong>
              <span style="color:var(--color-text-secondary)"> — ${bmiCategory(bmi)}</span>
            </div>
          </div>
        </div>

        <!-- TDEE -->
        <div class="stat-grid">
          ${[
            { l: 'TMB', v: Math.round(bmr), u: 'kcal' },
            { l: 'TDEE', v: tde, u: 'kcal' },
            { l: 'Objetivo', v: cal, u: 'kcal' },
            { l: 'Actividad', v: ACT_LABEL[p.activityLevel] ?? '—', u: '' }
          ].map(s => `
            <div class="card" style="padding:var(--space-3)">
              <div class="card__label">${s.l}</div>
              <div style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;line-height:1">${s.v}${s.u ? `<span style="font-size:var(--text-sm);font-weight:400;color:var(--color-text-secondary)"> ${s.u}</span>` : ''}</div>
            </div>
          `).join('')}
        </div>

        <!-- Macros -->
        <div class="card">
          <div class="card__label" style="margin-bottom:var(--space-4)">Objetivos diarios</div>
          ${[
            { l: 'Proteínas',      v: mac.proteinG, u: 'g',    c: 'var(--color-protein)' },
            { l: 'Carbohidratos',  v: mac.carbsG,   u: 'g',    c: 'var(--color-carbs)'   },
            { l: 'Grasas',         v: mac.fatG,     u: 'g',    c: 'var(--color-fat)'     },
            { l: 'Agua',           v: p.targets?.waterMl ?? 2000, u: 'ml', c: 'var(--color-water)' }
          ].map(m => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border-subtle)">
              <div style="display:flex;align-items:center;gap:var(--space-2)">
                <div style="width:7px;height:7px;border-radius:50%;background:${m.c}"></div>
                <span style="font-size:var(--text-sm);color:var(--color-text-secondary)">${m.l}</span>
              </div>
              <div style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700">${m.v}<span style="font-size:var(--text-sm);font-weight:400;color:var(--color-text-secondary)"> ${m.u}</span></div>
            </div>
          `).join('')}
        </div>

        <!-- Objetivo -->
        <div class="card" style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="font-size:1.8rem">${GOALS.find(g => g.v === p.goal)?.i ?? '?'}</div>
          <div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.06em">Objetivo</div>
            <div style="font-weight:var(--weight-semibold)">${GOAL_LABEL[p.goal] ?? '—'}</div>
          </div>
        </div>

        <!-- Edit form (hidden by default) -->
        <div id="edit-section" style="display:none">
          <div class="card">
            <div style="font-size:var(--text-base);font-weight:var(--weight-semibold);margin-bottom:var(--space-4)">Editar perfil</div>
            ${this._formHtml(p)}
            <div style="display:flex;gap:var(--space-3);margin-top:var(--space-5)">
              <button class="btn btn--secondary" style="flex:1" id="p-cancel">Cancelar</button>
              <button class="btn btn--primary"   style="flex:2" id="p-save">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _onboardingView() {
    return `
      <div style="padding:var(--space-6) var(--space-4) var(--space-10)">
        <div style="margin-bottom:var(--space-6)">
          <div class="display" style="font-size:var(--text-3xl);margin-bottom:var(--space-2)">
            ¡Bienvenido a<br><span style="color:var(--color-accent)">LM Nutrition!</span>
          </div>
          <p style="color:var(--color-text-secondary)">
            Configurá tu perfil para calcular tus objetivos de calorías y macros.
          </p>
        </div>
        <div class="card">
          ${this._formHtml(this._profile ?? {})}
          <button class="btn btn--primary btn--full" id="p-save" style="margin-top:var(--space-5)">
            Calcular mis objetivos →
          </button>
        </div>
      </div>
    `;
  },

  _formHtml(p) {
    return `
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="input-group">
          <label class="input-label">Nombre</label>
          <input class="input" id="f-name" type="text" placeholder="Tu nombre" value="${p.name ?? ''}">
        </div>

        <div class="input-group">
          <label class="input-label">Sexo biológico</label>
          <div class="choice-group">
            <button type="button" class="choice-btn ${p.sex === 'male' ? 'selected' : ''}" data-sex="male">Masculino</button>
            <button type="button" class="choice-btn ${p.sex === 'female' ? 'selected' : ''}" data-sex="female">Femenino</button>
          </div>
          <input type="hidden" id="f-sex" value="${p.sex ?? ''}">
        </div>

        <div class="input-group">
          <label class="input-label">Fecha de nacimiento</label>
          <input class="input" id="f-birth" type="date" value="${p.birthDate ?? ''}">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
          <div class="input-group">
            <label class="input-label">Altura (cm)</label>
            <input class="input" id="f-height" type="number" min="100" max="250" placeholder="170" value="${p.heightCm ?? ''}">
          </div>
          <div class="input-group">
            <label class="input-label">Peso (kg)</label>
            <input class="input" id="f-weight" type="number" min="30" max="300" step="0.1" placeholder="70" value="${p.weightKg ?? ''}">
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">Nivel de actividad</label>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${ACTIVITY.map(a => `
              <button type="button" class="choice-btn ${p.activityLevel === a.v ? 'selected' : ''}"
                data-activity="${a.v}" style="text-align:left;height:auto;padding:var(--space-2) var(--space-3);justify-content:flex-start">
                <span style="font-weight:600">${a.l}</span>
                <span style="opacity:0.6;margin-left:var(--space-2);font-size:var(--text-xs)">${a.d}</span>
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="f-activity" value="${p.activityLevel ?? ''}">
        </div>

        <div class="input-group">
          <label class="input-label">Objetivo</label>
          <div class="choice-group">
            ${GOALS.map(g => `
              <button type="button" class="choice-btn ${p.goal === g.v ? 'selected' : ''}"
                data-goal="${g.v}" style="flex-direction:column;height:auto;padding:var(--space-3) var(--space-2)">
                <span style="font-size:1.2rem">${g.i}</span>
                <span style="font-size:var(--text-xs);margin-top:2px">${g.l}</span>
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="f-goal" value="${p.goal ?? ''}">
        </div>
      </div>
    `;
  },

  _bind(container) {
    container.addEventListener('click', e => {
      // Sex
      const sex = e.target.closest('[data-sex]');
      if (sex) {
        container.querySelectorAll('[data-sex]').forEach(b => b.classList.toggle('selected', b === sex));
        const h = container.querySelector('#f-sex'); if (h) h.value = sex.dataset.sex;
      }
      // Activity
      const act = e.target.closest('[data-activity]');
      if (act) {
        container.querySelectorAll('[data-activity]').forEach(b => b.classList.toggle('selected', b === act));
        const h = container.querySelector('#f-activity'); if (h) h.value = act.dataset.activity;
      }
      // Goal
      const goal = e.target.closest('[data-goal]');
      if (goal) {
        container.querySelectorAll('[data-goal]').forEach(b => b.classList.toggle('selected', b === goal));
        const h = container.querySelector('#f-goal'); if (h) h.value = goal.dataset.goal;
      }
      // Edit toggle
      if (e.target.id === 'p-edit-btn') {
        container.querySelector('#edit-section').style.display = 'block';
        container.querySelector('#edit-section').scrollIntoView({ behavior: 'smooth' });
      }
      if (e.target.id === 'p-cancel') {
        container.querySelector('#edit-section').style.display = 'none';
      }
      // Save
      if (e.target.id === 'p-save') this._save(container);
    });
  },

  async _save(container) {
    const g = id => container.querySelector(id)?.value?.trim() ?? '';
    const data = {
      name:          g('#f-name'),
      sex:           g('#f-sex'),
      birthDate:     g('#f-birth'),
      heightCm:      parseFloat(g('#f-height')) || null,
      weightKg:      parseFloat(g('#f-weight')) || null,
      activityLevel: g('#f-activity'),
      goal:          g('#f-goal')
    };
    if (!data.name || !data.sex || !data.birthDate || !data.heightCm || !data.weightKg || !data.activityLevel || !data.goal) {
      toast.show('Completá todos los campos', 'warning'); return;
    }
    try {
      await profileService.save(data);
      toast.show('Perfil guardado correctamente', 'success');
      this._profile = await profileService.get();
      container.innerHTML = this._profileView();
      this._bind(container);
    } catch (err) {
      console.error(err);
      toast.show('Error al guardar', 'error');
    }
  }
};
