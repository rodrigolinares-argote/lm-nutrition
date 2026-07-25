/**
 * LM Nutrition — MacroRing
 * Anillos SVG concéntricos. Elemento signature del diseño.
 * Cuatro anillos: calorías (exterior), proteína, carbos, grasas (interior).
 */

import { pct } from '../utils/macroCalc.js';

const CX = 108, CY = 108, SIZE = 216;
const RINGS = [
  { key: 'calories', r: 90, stroke: '#00C896', sw: 11 },
  { key: 'proteinG', r: 73, stroke: '#5B8FF9', sw: 10 },
  { key: 'carbsG',   r: 56, stroke: '#F6C94E', sw: 10 },
  { key: 'fatG',     r: 39, stroke: '#FF7C5C', sw: 10 }
];

function circ(r) { return +(2 * Math.PI * r).toFixed(2); }

export class MacroRing {
  constructor(container) {
    this._c = container;
    this._render();
  }

  _render() {
    this._c.innerHTML = `
      <div class="macro-ring-wrap">
        <div class="macro-ring">
          <svg viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true">
            ${RINGS.map(r => {
              const c = circ(r.r);
              return `
                <circle class="ring-track" cx="${CX}" cy="${CY}" r="${r.r}" stroke-width="${r.sw}"/>
                <circle class="ring-progress" id="rp-${r.key}"
                  cx="${CX}" cy="${CY}" r="${r.r}"
                  stroke="${r.stroke}" stroke-width="${r.sw}"
                  stroke-dasharray="0 ${c}"/>
              `;
            }).join('')}
          </svg>
          <div class="ring-center">
            <div class="ring-kcal" id="ring-kcal">0</div>
            <div class="ring-kcal-label">kcal consumidas</div>
            <div class="ring-remaining" id="ring-rem"></div>
          </div>
        </div>

        <div class="macro-pills">
          ${[
            { key: 'proteinG', name: 'Proteína', color: '#5B8FF9' },
            { key: 'carbsG',   name: 'Carbos',   color: '#F6C94E' },
            { key: 'fatG',     name: 'Grasas',   color: '#FF7C5C' }
          ].map(m => `
            <div class="macro-pill">
              <div class="macro-pill__dot" style="background:${m.color}"></div>
              <div class="macro-pill__val" id="pill-${m.key}">0g</div>
              <div class="macro-pill__name">${m.name}</div>
              <div class="macro-pill__goal" id="pill-g-${m.key}">/ 0g</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  update({ consumed, target }) {
    if (!consumed || !target) return;

    // Centro
    this._animNum(this._c.querySelector('#ring-kcal'), Math.round(consumed.calories ?? 0));
    const rem = Math.max(0, (target.calories ?? 0) - (consumed.calories ?? 0));
    const remEl = this._c.querySelector('#ring-rem');
    if (remEl) remEl.textContent = rem > 0 ? `${Math.round(rem)} restantes` : '¡Objetivo!';

    // Anillos
    for (const r of RINGS) {
      const el = this._c.querySelector(`#rp-${r.key}`);
      if (!el) continue;
      const p = pct(consumed[r.key] ?? 0, target[r.key] ?? 1) / 100;
      const c = circ(r.r);
      el.style.strokeDasharray = `${+(c * p).toFixed(2)} ${c}`;
    }

    // Pills
    for (const k of ['proteinG', 'carbsG', 'fatG']) {
      const v = this._c.querySelector(`#pill-${k}`);
      const g = this._c.querySelector(`#pill-g-${k}`);
      if (v) v.textContent = `${Math.round(consumed[k] ?? 0)}g`;
      if (g) g.textContent = `/ ${Math.round(target[k] ?? 0)}g`;
    }
  }

  _animNum(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const dur   = 550;
    const t0    = performance.now();
    const step  = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (target - start) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
