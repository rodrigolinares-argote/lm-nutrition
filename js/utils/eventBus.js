/**
 * LM Nutrition — EventBus
 * Pub/Sub desacoplado. Los módulos nunca se importan entre sí,
 * se comunican exclusivamente via eventos.
 */

class EventBus {
  constructor() {
    this._map = new Map();
    this._mw  = [];
  }

  on(event, cb) {
    if (!this._map.has(event)) this._map.set(event, new Set());
    this._map.get(event).add(cb);
    return () => this.off(event, cb);
  }

  once(event, cb) {
    const w = (d) => { cb(d); this.off(event, w); };
    return this.on(event, w);
  }

  off(event, cb) {
    const s = this._map.get(event);
    if (!s) return;
    s.delete(cb);
    if (!s.size) this._map.delete(event);
  }

  emit(event, data = null) {
    for (const mw of this._mw) mw(event, data);
    const s = this._map.get(event);
    if (!s) return;
    for (const cb of s) {
      try { cb(data); } catch (e) { console.error(`[EventBus] "${event}":`, e); }
    }
  }

  use(fn) { this._mw.push(fn); }
  clear(event = null) { event ? this._map.delete(event) : this._map.clear(); }
}

export const eventBus = new EventBus();

export const EVENTS = {
  APP_READY:         'app:ready',
  NAV_CHANGE:        'nav:change',
  PROFILE_UPDATED:   'profile:updated',
  MEAL_ITEM_ADDED:   'meal:item:added',
  MEAL_ITEM_DELETED: 'meal:item:deleted',
  NUTRITION_UPDATED: 'nutrition:updated',
  FOOD_CREATED:      'food:created',
  FOOD_UPDATED:      'food:updated',
  FOOD_DELETED:      'food:deleted',
  WEIGHT_LOGGED:     'weight:logged',
  WATER_LOGGED:      'water:logged',
  SYNC_STARTED:      'sync:started',
  SYNC_COMPLETED:    'sync:completed',
  AUTH_CHANGED:      'auth:changed'
};
