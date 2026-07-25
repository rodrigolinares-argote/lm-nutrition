/**
 * LM Nutrition — BottomNav
 * Barra de navegación inferior. Se monta una sola vez en #app.
 */

import { router }           from '../utils/router.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';

const TABS = [
  { route: 'dashboard', label: 'Inicio',    svg: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { route: 'log',       label: 'Registrar', svg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
  { route: 'foods',     label: 'Alimentos', svg: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
  { route: 'progress',  label: 'Progreso',  svg: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>' },
  { route: 'profile',   label: 'Perfil',    svg: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' }
];

function icon(svg) {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
}

export function mountBottomNav(container) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Navegación principal');

  nav.innerHTML = TABS.map(t => `
    <button class="nav-item" data-route="${t.route}" type="button" aria-label="${t.label}">
      <div class="nav-indicator"></div>
      <div class="nav-icon">${icon(t.svg)}</div>
      <span class="nav-label">${t.label}</span>
    </button>
  `).join('');

  container.appendChild(nav);

  function setActive(route) {
    nav.querySelectorAll('.nav-item').forEach(btn => {
      const active = btn.dataset.route === route;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  nav.addEventListener('click', e => {
    const btn = e.target.closest('[data-route]');
    if (btn) router.navigate(btn.dataset.route);
  });

  eventBus.on(EVENTS.NAV_CHANGE, ({ to }) => setActive(to));
  setActive(router.current());
}
