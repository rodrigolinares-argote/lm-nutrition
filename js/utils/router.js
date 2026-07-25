/**
 * LM Nutrition — Router SPA
 * Hash-based, sin dependencias de servidor.
 * Compatible con Capacitor (WebView).
 * Soporta guards para auth futura.
 */

import { eventBus, EVENTS } from './eventBus.js';

class Router {
  constructor() {
    this._routes  = new Map();
    this._guards  = [];
    this._current = null;
    this._container = null;
    this._transitioning = false;
  }

  register(name, module, title = 'LM Nutrition') {
    this._routes.set(name, { module, title });
  }

  addGuard(fn) { this._guards.push(fn); }

  start(container, defaultRoute = 'dashboard') {
    this._container = container;
    window.addEventListener('hashchange', () => this._handle());
    this._handle(defaultRoute);
  }

  navigate(route) {
    window.location.hash = route;
  }

  current() { return this._current; }

  _getHash() { return window.location.hash.slice(1) || null; }

  async _handle(fallback = 'dashboard') {
    if (this._transitioning) return;
    const raw  = this._getHash() || fallback;
    const name = raw.split('/')[0];

    // Run guards
    for (const g of this._guards) {
      const r = await g(name, this._current);
      if (r === false)           return;
      if (typeof r === 'string') { this.navigate(r); return; }
    }

    if (name === this._current) return;

    const route = this._routes.get(name) || this._routes.get(fallback);
    if (!route) { console.warn(`[Router] Ruta desconocida: "${name}"`); return; }

    this._transitioning = true;

    // Destroy previous
    if (this._current) {
      const prev = this._routes.get(this._current);
      if (prev?.module?.destroy) prev.module.destroy();
    }

    const from = this._current;
    this._current = name;
    document.title = route.title;

    this._container.innerHTML = '';
    this._container.classList.add('page-enter');

    await route.module.render(this._container);

    const cleanup = () => this._container.classList.remove('page-enter');
    this._container.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 400); // fallback

    this._transitioning = false;
    eventBus.emit(EVENTS.NAV_CHANGE, { to: name, from });
  }
}

export const router = new Router();
